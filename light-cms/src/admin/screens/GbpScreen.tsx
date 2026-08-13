import { useEffect, useState } from "react";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { api, type GbpStatus } from "../api";
import { StatePanel } from "../components/StatePanel";

const metricLabels: Record<string, string> = {
  BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "Maps · desktop", BUSINESS_IMPRESSIONS_MOBILE_MAPS: "Maps · mobile",
  BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "Search · desktop", BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "Search · mobile",
  WEBSITE_CLICKS: "Nhấp website", CALL_CLICKS: "Cuộc gọi", BUSINESS_DIRECTION_REQUESTS: "Chỉ đường",
};

function dateTime(value?: number) { return value ? new Date(value * 1000).toLocaleString("vi-VN") : "Chưa có"; }
function Stars({ value }: { value: number }) { return <span className="gbp-stars" aria-label={`${value} trên 5 sao`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>; }

export function GbpScreen() {
  const [data, setData] = useState<GbpStatus | null>(null); const [error, setError] = useState(""); const [syncing, setSyncing] = useState(false);
  const load = () => api.gbp().then(setData).catch((reason: Error) => setError(reason.message));
  useEffect(() => { void load(); }, []);
  async function sync() { setSyncing(true); setError(""); try { await api.syncGbp(); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Đồng bộ thất bại"); } finally { setSyncing(false); } }
  if (error && !data) return <StatePanel title="Không tải được Google Business Profile" description={error} tone="error" />;
  if (!data) return <StatePanel title="Đang tải" description="Đang đọc dữ liệu Google Business Profile đã lưu trong hệ thống." />;
  const connection = data.connection;
  return <>
    <header className="page-heading"><p className="eyebrow">SEO / GEO · DỮ LIỆU THỰC TẾ</p><h1>Google Business Profile</h1><p>Đánh giá, hiệu suất Search/Maps và từ khóa tìm kiếm được đồng bộ server-side; website không gọi Google API khi tải trang.</p></header>
    {!connection ? <section className="paper-section"><StatePanel title="Chưa kết nối Google" description="Kết nối tài khoản có quyền quản lý hồ sơ Tùng Phát để bắt đầu đồng bộ dữ liệu thật." /><a className="button primary" href="/api/gbp/oauth/start">Kết nối Google Business Profile</a></section> : <>
      <section className="gbp-summary-grid">
        <article><span>Trạng thái</span><strong>{connection.status || "—"}</strong><small>{connection.last_error_safe || "Kết nối chỉ đọc"}</small></article>
        <article><span>Địa điểm</span><strong>{connection.location_title || "Tùng Phát"}</strong><small>{connection.location_name || "—"}</small></article>
        <article><span>Đánh giá</span><strong>{Number(data.reviews.total || 0)} · {data.reviews.average || "—"}★</strong><small>Lưu cache tối đa {data.retentionDays} ngày</small></article>
        <article><span>Đồng bộ gần nhất</span><strong>{dateTime(connection.last_sync_succeeded_at)}</strong><small>Reviews, performance và keywords</small></article>
      </section>
      <div className="gbp-toolbar"><button className="button primary" type="button" disabled={syncing} onClick={() => void sync()}><RefreshCw size={15} /> {syncing ? "Đang đồng bộ…" : "Đồng bộ ngay"}</button>{connection.location_maps_uri ? <a className="button secondary" href={connection.location_maps_uri} target="_blank" rel="noreferrer">Mở hồ sơ trên Google <ExternalLink size={15} /></a> : null}{error ? <span className="gbp-error">{error}</span> : null}</div>
      <section className="paper-section"><div className="section-heading-row"><div><h2>Đánh giá mới nhất</h2><p>Dữ liệu thật từ API; không tạo nội dung thay thế khi chưa đồng bộ.</p></div></div><div className="gbp-review-grid">{data.reviews.latest.length ? data.reviews.latest.map((review, index) => <article key={`${review.reviewer_display_name}-${review.update_time || index}`}><strong>{review.reviewer_display_name}</strong><Stars value={Number(review.rating)} /><p>{review.comment || "Đánh giá chỉ có số sao"}</p></article>) : <p>Chưa có đánh giá trong cache.</p>}</div></section>
      <section className="paper-section"><div className="section-heading-row"><div><h2>Hiệu suất GBP</h2><p>Google Search, Google Maps và hành động của khách hàng theo ngày.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Ngày</th><th>Metric</th><th>Giá trị</th></tr></thead><tbody>{data.metrics.map((row) => <tr key={`${row.metric_date}-${row.metric_name}`}><td>{row.metric_date}</td><td>{metricLabels[row.metric_name] || row.metric_name}</td><td><strong>{Number(row.metric_value).toLocaleString("vi-VN")}</strong></td></tr>)}</tbody></table></div></section>
      <section className="paper-section"><div className="section-heading-row"><div><h2>Từ khóa tìm kiếm</h2><p>Search keyword impressions hàng tháng dùng cho phân tích SEO/GEO.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Tháng</th><th>Từ khóa</th><th>Lượt hiển thị</th></tr></thead><tbody>{data.keywords.map((row) => <tr key={`${row.month}-${row.keyword}`}><td>{row.month}</td><td><strong>{row.keyword}</strong></td><td>{row.impressions ?? `≥ ${row.threshold ?? 0}`}</td></tr>)}</tbody></table></div></section>
    </>}
  </>;
}
