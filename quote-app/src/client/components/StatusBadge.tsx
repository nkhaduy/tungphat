import type { PaymentStatus, QuoteStatus } from "../../shared/types";

const labels: Record<QuoteStatus, string> = {
  DRAFT: "Nháp",
  ISSUED: "Đã phát hành",
  DEPOSITED: "Đã cọc",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  DEPOSITED: "Đã cọc",
  PARTIAL: "Thanh toán một phần",
  PAID: "Đã thanh toán",
};

export function StatusBadge({ status, paymentStatus }: { status: QuoteStatus; paymentStatus?: PaymentStatus }) {
  if (status === "CANCELLED") return <span className="status status-cancelled">{labels.CANCELLED}</span>;
  if (paymentStatus) return <span className={`status status-payment-${paymentStatus.toLowerCase()}`}>{paymentLabels[paymentStatus]}</span>;
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
