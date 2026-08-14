import { Banknote, CheckCircle2, HandCoins, X } from "lucide-react";
import { useState } from "react";
import { formatVnd, normalizePayment } from "../../shared/calculations";
import { paymentActionAmount } from "../../shared/payment";
import type { PaymentStatus } from "../../shared/types";

type PaymentActionsProps = {
  paymentStatus: PaymentStatus;
  receivedAmount: number;
  grandTotal: number;
  disabled?: boolean;
  onChange: (paymentStatus: PaymentStatus, receivedAmount: number) => void;
};

function parseVnd(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function PaymentActions({ paymentStatus, receivedAmount, grandTotal, disabled = false, onChange }: PaymentActionsProps) {
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState(receivedAmount);
  const [error, setError] = useState("");

  const choose = (nextStatus: PaymentStatus) => {
    const nextAmount = paymentActionAmount(nextStatus, grandTotal, receivedAmount);
    try {
      normalizePayment(nextStatus, nextAmount, grandTotal);
      setError("");
      onChange(nextStatus, nextAmount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Số tiền thanh toán không hợp lệ.");
    }
  };

  const openPartial = () => {
    setPartialAmount(receivedAmount > 0 && receivedAmount < grandTotal ? receivedAmount : 0);
    setError("");
    setPartialOpen(true);
  };

  const applyPartial = () => {
    try {
      normalizePayment("PARTIAL", partialAmount, grandTotal);
      onChange("PARTIAL", partialAmount);
      setError("");
      setPartialOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Số tiền thanh toán không hợp lệ.");
    }
  };

  return (
    <section className="payment-actions" aria-labelledby="payment-actions-title">
      <div className="payment-actions-heading">
        <div>
          <strong id="payment-actions-title">Trạng thái thanh toán</strong>
          <span>Đã nhận {formatVnd(receivedAmount)}</span>
        </div>
        {paymentStatus !== "UNPAID" ? <button type="button" className="payment-reset" disabled={disabled} onClick={() => choose("UNPAID")}>Đặt lại</button> : null}
      </div>
      <div className="payment-action-grid">
        <button type="button" className={paymentStatus === "DEPOSITED" ? "payment-action active" : "payment-action"} disabled={disabled} onClick={() => choose("DEPOSITED")}>
          <HandCoins size={17} aria-hidden="true" /><span>Đã cọc</span>
        </button>
        <button type="button" className={paymentStatus === "PARTIAL" ? "payment-action active" : "payment-action"} disabled={disabled} onClick={openPartial}>
          <Banknote size={17} aria-hidden="true" /><span>Thanh toán một phần</span>
        </button>
        <button type="button" className={paymentStatus === "PAID" ? "payment-action active paid" : "payment-action paid"} disabled={disabled} onClick={() => choose("PAID")}>
          <CheckCircle2 size={17} aria-hidden="true" /><span>Đã thanh toán</span>
        </button>
      </div>
      {error ? <p className="payment-error" role="alert">{error}</p> : null}
      {partialOpen ? <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !disabled) setPartialOpen(false); }}>
        <section className="confirm-dialog payment-dialog" role="dialog" aria-modal="true" aria-labelledby="partial-payment-title">
          <button type="button" className="payment-dialog-close" aria-label="Đóng" disabled={disabled} onClick={() => setPartialOpen(false)}><X size={18} /></button>
          <h2 id="partial-payment-title">Nhập số tiền đã nhận</h2>
          <p>Số tiền phải lớn hơn 0 và nhỏ hơn tổng thanh toán {formatVnd(grandTotal)}.</p>
          <label className="payment-dialog-input"><span>Số tiền thực nhận</span><input autoFocus inputMode="numeric" value={partialAmount || ""} onChange={(event) => setPartialAmount(parseVnd(event.target.value))} /><small>đ</small></label>
          {error ? <p className="payment-error" role="alert">{error}</p> : null}
          <div className="confirm-dialog-actions">
            <button className="button secondary" type="button" disabled={disabled} onClick={() => setPartialOpen(false)}>Hủy</button>
            <button className="button primary" type="button" disabled={disabled} onClick={applyPartial}>Xác nhận</button>
          </div>
        </section>
      </div> : null}
    </section>
  );
}
