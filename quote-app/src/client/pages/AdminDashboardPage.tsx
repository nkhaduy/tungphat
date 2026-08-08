import { Banknote, CircleDollarSign, FileCheck2, FileClock, FileX2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatVnd } from "../../shared/calculations";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

type Metrics = {
  quotesToday: number;
  valueToday: number;
  totalDeposit: number;
  totalRemaining: number;
  drafts: number;
  cancelled: number;
  topEmployee: { fullName: string; quoteCount: number } | null;
};

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void api<{ metrics: Metrics }>("/api/admin/dashboard").then((result) => setMetrics(result.metrics)).catch((caught: Error) => setError(caught.message)); }, []);
  return (
    <div>
      <PageHeader title="Tổng quan báo giá" description="Số liệu vận hành nội bộ theo múi giờ Việt Nam." actions={<Link className="button primary" to="/bao-gia/moi">Tạo báo giá</Link>} />
      {error && <div className="form-error">{error}</div>}
      {!metrics ? <div className="dashboard-skeleton"><span /><span /><span /><span /></div> : <>
        <section className="metric-strip">
          <article><FileCheck2 /><span>Báo giá hôm nay</span><strong>{metrics.quotesToday}</strong></article>
          <article><CircleDollarSign /><span>Giá trị báo giá hôm nay</span><strong>{formatVnd(metrics.valueToday)}</strong></article>
          <article><Banknote /><span>Tổng tiền đã cọc</span><strong>{formatVnd(metrics.totalDeposit)}</strong></article>
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
