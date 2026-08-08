import type { QuoteStatus } from "../../shared/types";

const labels: Record<QuoteStatus, string> = {
  DRAFT: "Nháp",
  ISSUED: "Đã phát hành",
  DEPOSITED: "Đã cọc",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
