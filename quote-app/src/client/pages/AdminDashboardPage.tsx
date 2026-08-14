import { Eye, FileCheck2, Inbox } from "lucide-react";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { formatVnd } from "../../shared/calculations";
import { PAYMENT_QUEUE_SECTIONS, replaceQuoteInPaymentQueue } from "../../shared/payment";
import type { PaymentQueue, PaymentStatus, QuoteRecord } from "../../shared/types";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { PaymentActions } from "../components/PaymentActions";
import { QuoteQuickViewModal } from "../components/QuoteQuickViewModal";
import { StatusBadge } from "../components/StatusBadge";

const emptyQueue: PaymentQueue = { unpaid: [], deposited: [], partial: [], paid: [] };

export function AdminDashboardPage() {
  const [queue, setQueue] = useState<PaymentQueue>(emptyQueue);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof PaymentQueue>("unpaid");
  const [busyQuoteId, setBusyQuoteId] = useState("");
  const [error, setError] = useState("");
  const [quickViewQuote, setQuickViewQuote] = useState<QuoteRecord | null>(null);
  const [quickViewId, setQuickViewId] = useState("");
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState("");
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);

  useEffect(() => {
    void api<{ queue: PaymentQueue }>("/api/admin/payment-queue").then((queueResult) => {
      setQueue(queueResult.queue);
      setQueueLoaded(true);
    }).catch((caught: Error) => setError(caught.message));
  }, []);

  const updatePayment = async (quote: QuoteRecord, paymentStatus: PaymentStatus, receivedAmount: number) => {
    setBusyQuoteId(quote.id);
    setError("");
    try {
      const result = await api<{ quote: QuoteRecord }>(`/api/quotes/${quote.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ paymentStatus, receivedAmount, version: quote.version }),
      });
      setQueue((current) => replaceQuoteInPaymentQueue(current, result.quote));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật thanh toán.");
    } finally {
      setBusyQuoteId("");
    }
  };

  const loadQuickView = useCallback(async (quoteId: string) => {
    setQuickViewId(quoteId);
    setQuickViewQuote(null);
    setQuickViewLoading(true);
    setQuickViewError("");
    try {
      const result = await api<{ quote: QuoteRecord }>(`/api/quotes/${quoteId}`);
      setQuickViewQuote(result.quote);
    } catch (caught) {
      setQuickViewError(caught instanceof Error ? caught.message : "Không thể tải chi tiết đơn.");
    } finally {
      setQuickViewLoading(false);
    }
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewId("");
    setQuickViewQuote(null);
    setQuickViewError("");
    setReturnFocus(null);
  }, []);

  const activeQuotes = queue[activeSection];
  const activeMeta = PAYMENT_QUEUE_SECTIONS.find((section) => section.key === activeSection) ?? PAYMENT_QUEUE_SECTIONS[0];

  return (
    <div>
      <PageHeader title="Cần xử lý" actions={<Link className="button primary" to="/bao-gia/moi">Tạo báo giá</Link>} />
      {error ? <div className="form-error">{error}</div> : null}

      <section className="payment-queue" aria-labelledby="payment-queue-title">
        <div className="payment-queue-heading">
          <div><span className="queue-eyebrow"><Inbox size={15} /> Trung tâm xử lý</span><h2 id="payment-queue-title">Trạng thái đơn hàng</h2></div>
          <Link to="/admin/bao-gia">Mở tất cả báo giá →</Link>
        </div>
        <div className="payment-queue-tabs" role="tablist" aria-label="Trạng thái thanh toán">
          {PAYMENT_QUEUE_SECTIONS.map((section) => <button key={section.key} type="button" role="tab" aria-selected={activeSection === section.key} className={activeSection === section.key ? `queue-tab active ${section.key}` : `queue-tab ${section.key}`} onClick={() => setActiveSection(section.key)}><span>{section.label}</span><strong>{queue[section.key].length}</strong></button>)}
        </div>
        <div className="payment-queue-panel" role="tabpanel">
          <div className="payment-queue-panel-heading"><div><h3>{activeMeta.label}</h3></div><strong>{activeQuotes.length} đơn</strong></div>
          {!queueLoaded ? <div className="queue-loading"><span /><span /><span /></div> : activeQuotes.length === 0 ? <div className="queue-empty"><FileCheck2 size={28} /><strong>Không có đơn trong nhóm này</strong><span>Các đơn sẽ tự chuyển nhóm sau khi cập nhật thanh toán.</span></div> : <div className="queue-list">
            {activeQuotes.map((quote) => <article key={quote.id} className="queue-card">
              <div className="queue-card-main">
                <div className="queue-card-title"><div><span>Khách hàng</span><h3>{quote.customerName || "Chưa nhập tên khách hàng"}</h3><small>{quote.quoteNumber} · {quote.quoteDate.split("-").reverse().join("/")}</small></div><StatusBadge status={quote.status} paymentStatus={quote.paymentStatus} /></div>
                <dl className="queue-card-details"><div><dt>Nhân viên</dt><dd>{quote.employeeName}</dd></div><div><dt>Tổng tiền</dt><dd>{formatVnd(quote.totals.grandTotal)}</dd></div><div><dt>Đã nhận</dt><dd>{formatVnd(quote.totals.depositAmount)}</dd></div><div><dt>Còn lại</dt><dd className="queue-remaining">{formatVnd(quote.totals.remainingAmount)}</dd></div></dl>
                <button className="button secondary queue-view" type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => { setReturnFocus(event.currentTarget); void loadQuickView(quote.id); }}><Eye size={16} /> Xem đơn</button>
              </div>
              <PaymentActions compact paymentStatus={quote.paymentStatus} receivedAmount={quote.totals.depositAmount} grandTotal={quote.totals.grandTotal} disabled={busyQuoteId === quote.id} onChange={(paymentStatus, receivedAmount) => void updatePayment(quote, paymentStatus, receivedAmount)} />
            </article>)}
          </div>}
        </div>
      </section>

      {quickViewId ? <QuoteQuickViewModal quote={quickViewQuote} loading={quickViewLoading} error={quickViewError} onClose={closeQuickView} onRetry={() => void loadQuickView(quickViewId)} returnFocus={returnFocus} /> : null}
    </div>
  );
}
