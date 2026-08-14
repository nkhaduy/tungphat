import { CalendarDays, Edit3, MapPin, RefreshCw, UserRound, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatVnd } from "../../shared/calculations";
import { shouldShowSpecificationColumn } from "../../shared/display";
import type { QuoteRecord } from "../../shared/types";
import { OldDebtNotice } from "./OldDebtNotice";
import { StatusBadge } from "./StatusBadge";

type QuoteQuickViewModalProps = {
  quote: QuoteRecord | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
  returnFocus?: HTMLElement | null;
};

export function QuoteQuickViewModal({ quote, loading, error, onClose, onRetry, returnFocus }: QuoteQuickViewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const showSpecifications = quote ? shouldShowSpecificationColumn(quote.items) : false;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      returnFocus?.focus();
    };
  }, [onClose, returnFocus]);

  return (
    <div className="quick-view-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="quote-quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <header className="quick-view-header">
          <div>
            <span>Xem nhanh báo giá</span>
            <h2 id="quick-view-title">{quote?.customerName || quote?.quoteNumber || "Đang tải đơn"}</h2>
            {quote ? <small>{quote.quoteNumber}</small> : null}
          </div>
          <button ref={closeButtonRef} type="button" className="quick-view-close" aria-label="Đóng" onClick={onClose}><X size={21} /></button>
        </header>

        {loading ? <div className="quick-view-loading" aria-live="polite"><span /><span /><span />Đang tải chi tiết đơn…</div> : null}
        {!loading && error ? <div className="quick-view-error" role="alert"><strong>Không thể mở đơn</strong><span>{error}</span><button type="button" className="button secondary" onClick={onRetry}><RefreshCw size={16} /> Thử lại</button></div> : null}
        {!loading && !error && quote ? <div className="quick-view-content">
          <div className="quick-view-meta">
            <span><CalendarDays size={16} /><small>Ngày lập</small><strong>{quote.quoteDate.split("-").reverse().join("/")}</strong></span>
            <span><UserRound size={16} /><small>Nhân viên</small><strong>{quote.employeeName}</strong></span>
            <span><MapPin size={16} /><small>Chi nhánh</small><strong>{quote.branchName}</strong></span>
            <StatusBadge status={quote.status} paymentStatus={quote.paymentStatus} />
          </div>

          <section className="quick-view-customer">
            <div><span>Khách hàng</span><strong>{quote.customerName || "Chưa nhập tên khách hàng"}</strong></div>
            <div><span>Số điện thoại</span><strong>{quote.customerPhone || "—"}</strong></div>
            <div><span>Địa chỉ</span><strong>{quote.customerAddress || "—"}</strong></div>
          </section>

          <div className="quick-view-table-wrap">
            <table className="quick-view-table">
              <thead><tr><th>STT</th><th>Sản phẩm</th>{showSpecifications ? <th>Quy cách</th> : null}<th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>{quote.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.productName || "—"}</strong><small>{item.note}</small></td>{showSpecifications ? <td>{item.specification}</td> : null}<td>{item.quantity.toLocaleString("vi-VN")} {item.unit}</td><td>{formatVnd(item.unitPrice)}</td><td>{formatVnd(item.lineTotal)}</td></tr>)}</tbody>
            </table>
          </div>

          <section className="quick-view-totals">
            <div><span>Tiền hàng</span><strong>{formatVnd(quote.totals.subtotal)}</strong></div>
            <div><span>Thuế VAT</span><strong>{formatVnd(quote.totals.vatAmount)}</strong></div>
            <div><span>Tổng thanh toán</span><strong>{formatVnd(quote.totals.grandTotal)}</strong></div>
            <div className="received"><span>Đã nhận</span><strong>{formatVnd(quote.totals.depositAmount)}</strong></div>
            <div className="remaining"><span>Còn lại</span><strong>{formatVnd(quote.totals.remainingAmount)}</strong></div>
          </section>
          {(quote.oldDebtAmount ?? 0) > 0 ? <dl className="quick-view-old-debt"><OldDebtNotice amount={quote.oldDebtAmount ?? 0} /></dl> : null}
          {quote.status !== "CANCELLED" ? <div className="quick-view-actions"><a className="button primary" href={`/bao-gia/${quote.id}/chinh-sua`}><Edit3 size={16} /> Chỉnh báo giá</a></div> : null}
        </div> : null}
      </section>
    </div>
  );
}
