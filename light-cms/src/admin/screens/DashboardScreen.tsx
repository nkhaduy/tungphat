import { useEffect, useState } from "react";
import { api } from "../api";
import { StatePanel } from "../components/StatePanel";
import { lightCmsUiCopy } from "../environment";

export function DashboardScreen() {
  const [data, setData] = useState<{ counts: Record<string, number>; published: number } | null>(null); const [error, setError] = useState("");
  useEffect(() => { api.dashboard().then(setData).catch((reason: Error) => setError(reason.message)); }, []);
  if (error) return <StatePanel title="Không tải được tổng quan" description={error} tone="error" />;
  if (!data) return <StatePanel title="Đang tải dữ liệu" description={lightCmsUiCopy.dashboardLoading} />;
  return <><header className="page-heading"><p className="eyebrow">TỔNG QUAN</p><h1>Nội dung Tùng Phát</h1><p>Theo dõi số lượng bản ghi và trạng thái xuất bản mà không cần mở nhiều màn hình.</p></header><section className="metric-grid" aria-label="Số lượng nội dung">{Object.entries(data.counts).map(([key, value]) => <article key={key}><span>{key}</span><strong>{value}</strong></article>)}<article className="accent"><span>Đang xuất bản</span><strong>{data.published}</strong></article></section><section className="paper-section"><h2>{lightCmsUiCopy.dashboardTitle}</h2><div className="rule-list"><p><strong>{lightCmsUiCopy.dashboardLead}</strong><span>{lightCmsUiCopy.dashboardLeadDescription}</span></p><p><strong>Lưu có kiểm soát version.</strong><span>Nếu nội dung đã đổi ở phiên khác, hệ thống yêu cầu tải lại thay vì ghi đè.</span></p><p><strong>Media chỉ công khai sau finalize.</strong><span>File pending không xuất hiện trong public snapshot.</span></p></div></section></>;
}
