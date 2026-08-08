import { useEffect, useState } from "react";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { api, type BaogiaUser } from "../api";
import { StatePanel } from "../components/StatePanel";
import { lightCmsUiCopy } from "../environment";

type AuditEntry = {
  id: string;
  action: string;
  collection_key?: string | null;
  record_id?: string | null;
  request_id: string;
  metadata_json?: string;
  created_at: string;
};

const roleLabels: Record<BaogiaUser["role"], string> = {
  "super-admin": "Quản trị viên",
  admin: "Quản trị viên",
  editor: "Biên tập viên",
};

function UsersTable({ users }: { users: BaogiaUser[] }) {
  return <section className="paper-section data-section">
    <div className="section-heading-row">
      <div><h2>Tài khoản được đồng bộ</h2><p>Thông tin đăng nhập và trạng thái được quản lý tập trung trong hệ thống Báo Giá.</p></div>
      <a className="button secondary" href="https://baogia.mdftungphat.com/admin/nhan-vien" target="_blank" rel="noreferrer">Quản lý tài khoản trong Báo Giá <ExternalLink size={15} /></a>
    </div>
    {users.length === 0 ? <StatePanel title="Chưa có người dùng" description="Chưa có tài khoản Báo Giá nào từng đăng nhập vào CMS." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Họ tên</th><th>Tài khoản Báo Giá</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.display_name}</strong></td><td>{user.baogia_username}</td><td>{roleLabels[user.role]}</td><td><span className={user.status === "active" ? "status-badge active" : "status-badge disabled"}>{user.status === "active" ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span></td><td>{user.last_login_at ? new Date(user.last_login_at).toLocaleString("vi-VN") : "Chưa ghi nhận"}</td></tr>)}</tbody></table></div>}
  </section>;
}

function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <section className="paper-section"><StatePanel title="Chưa có nhật ký" description="Các thao tác quản trị sẽ xuất hiện tại đây." /></section>;
  return <section className="audit-list">{entries.map((entry) => <article key={entry.id}><div className="audit-icon" aria-hidden="true">{entry.action.slice(0, 1).toUpperCase()}</div><div><div><strong>{entry.action}</strong><span>{new Date(entry.created_at).toLocaleString("vi-VN")}</span></div><p>{entry.collection_key || "Hệ thống"}{entry.record_id ? ` · ${entry.record_id}` : ""}</p><small>Mã yêu cầu: {entry.request_id}</small>{entry.metadata_json && entry.metadata_json !== "{}" ? <details><summary>Xem chi tiết</summary><pre>{entry.metadata_json}</pre></details> : null}</div></article>)}</section>;
}

export function DataScreen({ kind }: { kind: "users" | "versions" | "audit" }) {
  const [data, setData] = useState<unknown[] | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    if (kind === "versions") { setData([]); return; }
    void (kind === "users" ? api.users() : api.audit()).then(setData).catch((reason: Error) => setError(reason.message));
  }, [kind]);
  if (error) return <StatePanel title="Không tải được dữ liệu" description={error} tone="error" />;
  if (!data) return <StatePanel title="Đang tải" description={lightCmsUiCopy.dataLoading} />;
  if (kind === "versions") return <><header className="page-heading"><p className="eyebrow">LỊCH SỬ NỘI DUNG</p><h1>Phiên bản</h1><p>Mỗi nội dung giữ lịch sử riêng để xem lại hoặc khôi phục an toàn.</p></header><section className="paper-section"><StatePanel title="Mở một nội dung để xem phiên bản" description="Chọn Sản phẩm, Bài viết, Dự án hoặc Trang; lịch sử phiên bản nằm trong màn hình biên tập tương ứng." /></section></>;
  return <><header className="page-heading"><p className="eyebrow">VẬN HÀNH</p><h1>{kind === "users" ? "Người dùng" : "Nhật ký"}</h1><p>{kind === "users" ? "CMS chỉ đọc danh tính Báo Giá; quyền vẫn được kiểm tra tại Worker cho mọi thao tác." : "Theo dõi đăng nhập, thay đổi nội dung và các thao tác quản trị quan trọng."}</p></header>{kind === "users" ? <UsersTable users={data as BaogiaUser[]} /> : <AuditList entries={data as AuditEntry[]} />}</>;
}
