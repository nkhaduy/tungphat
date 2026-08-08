import { useEffect, useState } from "react";
import FileCheck2 from "lucide-react/dist/esm/icons/file-check-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import Package from "lucide-react/dist/esm/icons/package";
import { api } from "../api";
import { StatePanel } from "../components/StatePanel";
import { lightCmsUiCopy } from "../environment";

const collectionMeta = {
  products: { label: "Sản phẩm", icon: Package },
  articles: { label: "Bài viết", icon: Newspaper },
  projects: { label: "Dự án", icon: FolderKanban },
  pages: { label: "Trang", icon: FileText },
} as const;

export function DashboardScreen() {
  const [data, setData] = useState<{ counts: Record<string, number>; published: number } | null>(null); const [error, setError] = useState("");
  useEffect(() => { api.dashboard().then(setData).catch((reason: Error) => setError(reason.message)); }, []);
  if (error) return <StatePanel title="Không tải được tổng quan" description={error} tone="error" />;
  if (!data) return <StatePanel title="Đang tải dữ liệu" description={lightCmsUiCopy.dashboardLoading} />;
  const metrics = Object.entries(collectionMeta).map(([key, meta]) => ({ ...meta, key, value: data.counts[key] ?? 0 }));
  return <><header className="page-heading"><p className="eyebrow">TỔNG QUAN</p><h1>Quản trị nội dung</h1><p>Theo dõi nhanh toàn bộ nội dung website Tùng Phát và trạng thái xuất bản.</p></header><section className="metric-strip cms-metrics" aria-label="Số lượng nội dung">{metrics.map(({ key, label, icon: Icon, value }) => <article key={key}><Icon size={20} aria-hidden="true" /><span>{label}</span><strong>{value}</strong></article>)}<article className="metric-emphasis"><FileCheck2 size={20} aria-hidden="true" /><span>Nội dung đang xuất bản</span><strong>{data.published}</strong></article></section><section className="dashboard-details cms-dashboard-details"><div className="status-breakdown"><h2>Vận hành nội dung</h2><div><span><i className="dot published" />Đã xuất bản</span><strong>{data.published}</strong></div><div><span><i className="dot draft" />Tổng bản ghi</span><strong>{metrics.reduce((sum, item) => sum + item.value, 0)}</strong></div></div><div className="dashboard-guidance"><h2>{lightCmsUiCopy.dashboardTitle}</h2><p><strong>{lightCmsUiCopy.dashboardLead}</strong></p><p>{lightCmsUiCopy.dashboardLeadDescription}</p></div><div className="dashboard-shortcuts"><h2>Lưu ý an toàn</h2><p>Phiên bản được lưu trước mỗi thay đổi quan trọng.</p><p>Media chỉ công khai sau khi tải lên hoàn tất.</p><p>Mọi thao tác quản trị đều được ghi nhật ký.</p></div></section></>;
}
