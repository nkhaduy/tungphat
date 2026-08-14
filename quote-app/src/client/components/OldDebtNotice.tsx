import { formatVnd } from "../../shared/calculations";

export function OldDebtNotice({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="old-debt-notice">
      <dt>NỢ CŨ</dt>
      <dd>{formatVnd(amount)}</dd>
      <small>Khoản riêng, không cộng vào tổng thanh toán</small>
    </div>
  );
}
