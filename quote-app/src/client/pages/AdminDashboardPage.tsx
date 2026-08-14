import { Banknote, CircleDollarSign, Eye, FileCheck2, FileClock, FileX2, Inbox, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatVnd } from "../../shared/calculations";
import { PAYMENT_QUEUE_SECTIONS, replaceQuoteInPaymentQueue } from "../../shared/payment";
import type { PaymentQueue, PaymentStatus, QuoteRecord } from "../../shared/types";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { PaymentActions } from "../components/PaymentActions";
import { StatusBadge } from "../components/StatusBadge";

type Metrics = {
  quotesToday: number;
  valueToday: number;
  totalDeposit: number;
  totalRemaining: number;
  drafts: number;
  cancelled: number;
  topEmployee: { fullName: string; quoteCount: number } | null;
};

const emptyQueue: PaymentQueue = { unpaid: [], deposited: [], partial: [], paid: [] };

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queue, setQueue] = useState<PaymentQueue>(emptyQueue);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof PaymentQueue>("unpaid");
  const [busyQuoteId, setBusyQuoteId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      api<{ metrics: Metrics }>("/api/admin/dashboard"),
      api<{ queue: PaymentQueue }>("/api/admin/payment-queue"),
    ]).then(([dashboardResult, queueResult]) => {
      setMetrics(dashboardResult.metrics);
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

  const activeQuotes = queue[activeSection];
  const activeMeta = PAYMENT_QUEUE_SECTIONS.find((section) => section.key === activeSection) ?? PAYMENT_QUEUE_SECTIONS[0];

  return (
    <div>
      <PageHeader title="Đơn hàng cần xử lý" description="Theo dõi thanh toán của toàn bộ báo giá do nhân viên tạo." actions={<Link className="button primary" to="/bao-gia/moi">Tạo báo giá</Link>} />
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
          <div className="payment-queue-panel-heading"><div><h3>{activeMeta.label}</h3><p>{activeMeta.description}</p></div><strong>{activeQuotes.length} đơn</strong></div>
          {!queueLoaded ? <div className="queue-loading"><span /><span /><span /></div> : activeQuotes.length === 0 ? <div className="queue-empty"><FileCheck2 size={28} /><strong>Không có đơn trong nhóm này</strong><span>Các đơn sẽ tự chuyển nhóm sau khi cập nhật thanh toán.</span></div> : <div className="queue-list">
            {activeQuotes.map((quote) => <article key={quote.id} className="queue-card">
              <div className="queue-card-main">
                <div className="queue-card-title"><div><span>{quote.quoteDate.split("-").reverse().join("/")}</span><h3>{quote.quoteNumber}</h3></div><StatusBadge status={quote.status} paymentStatus={quote.paymentStatus} /></div>
                <dl className="queue-card-details"><div><dt>Khách hàng</dt><dd>{quote.customerName || "—"}</dd></div><div><dt>Nhân viên</dt><dd>{quote.employeeName}</dd></div><div><dt>Tổng tiền</dt><dd>{formatVnd(quote.totals.grandTotal)}</dd></div><div><dt>Đã nhận</dt><dd>{formatVnd(quote.totals.depositAmount)}</dd></div><div><dt>Còn lại</dt><dd className="queue-remaining">{formatVnd(quote.totals.remainingAmount)}</dd></div></dl>
                <Link className="button secondary queue-view" to={`/admin/bao-gia/${quote.id}`}><Eye size={16} /> Xem đơn</Link>
              </div>
              {quote.paymentStatus !== "PAID" ? <PaymentActions compact paymentStatus={quote.paymentStatus} receivedAmount={quote.totals.depositAmount} grandTotal={quote.totals.grandTotal} disabled={busyQuoteId === quote.id} onChange={(paymentStatus, receivedAmount) => void updatePayment(quote, paymentStatus, receivedAmount)} /> : null}
            </article>)}
          </div>}
        </div>
      </section>

      {!metrics ? <div className="dashboard-skeleton"><span /><span /><span /><span /></div> : <>
        <section className="metric-strip dashboard-metrics">
          <article><FileCheck2 /><span>Báo giá hôm nay</span><strong>{metrics.quotesToday}</strong></article>
          <article><CircleDollarSign /><span>Giá trị báo giá hôm nay</span><strong>{formatVnd(metrics.valueToday)}</strong></article>
          <article><Banknote /><span>Tổng tiền đã nhận</span><strong>{formatVnd(metrics.totalDeposit)}</strong></article>
          <article className="metric-emphasis"><FileClock /><span>Tổng tiền còn lại</span><strong>{formatVnd(metrics.totalRemaining)}</strong></article>
        </section>
        <section className="dashboard-details">
          <div className="status-breakdown"><h2>Tình trạng xử lý</h2><div><span><i className="dot draft" />Báo giá nháp</span><strong>{metrics.drafts}</strong></div><div><span><i className="dot cancelled" />Báo giá đã hủy</span><strong>{metrics.cancelled}</strong></div><Link to="/admin/bao-gia">Mở danh sách báo giá →</Link></div>
          <div className="top-employee"><Trophy size={25} /><div><span>Nhân viên tạo nhiều báo giá nhất</span><strong>{metrics.topEmployee?.fullName ?? "Chưa có dữ liệu"}</strong><small>{metrics.topEmployee ? `${metrics.topEmployee.quoteCount} báo giá` : "—"}</small></div></div>
          <div className="dashboard-shortcuts"><h2>Quản trị nhanh</h2><Link to="/admin/nhan-vien">Quản lý nhân viên</Link><Link to="/admin/cai-dat">Thông tin công ty & ngân hàng</Link><Link to="/admin/lich-su">Xem lịch sử thao tác</Link><FileX2 aria-hidden="true" /></div>
        </section>
      </>}
    </div>
  );
}
