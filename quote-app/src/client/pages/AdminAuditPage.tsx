import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

type AuditLog = { id: string; action: string; entityType: string; entityId: string | null; actorName: string; createdAt: string; oldData: unknown; newData: unknown; requestId: string };

const actionLabels: Record<string, string> = { LOGIN_SUCCEEDED: "Đăng nhập", LOGIN_FAILED: "Đăng nhập thất bại", LOGOUT: "Đăng xuất", QUOTE_CREATED: "Tạo báo giá", QUOTE_UPDATED: "Sửa báo giá", PDF_EXPORTED: "Xuất PDF", QUOTE_CANCELLED: "Hủy báo giá", QUOTE_RESTORED: "Khôi phục báo giá", QUOTE_DUPLICATED: "Nhân bản báo giá", QUOTE_DELETED: "Xóa báo giá", QUOTE_ARCHIVED: "Lưu trữ báo giá", USER_CREATED: "Tạo tài khoản", USER_UPDATED: "Sửa tài khoản", USER_DELETED: "Xóa nhân viên", USER_PASSWORD_CHANGED: "Đổi mật khẩu", USER_PASSWORD_VIEWED: "Xem mật khẩu nhân viên", BRANCH_CREATED: "Tạo chi nhánh", BRANCH_UPDATED: "Sửa chi nhánh", SETTINGS_UPDATED: "Sửa cài đặt", LOGO_UPDATED: "Đổi logo" };

export function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]); const [action, setAction] = useState(""); const [entityId, setEntityId] = useState(""); const [error, setError] = useState("");
  const load = async () => { const params = new URLSearchParams(); if (action) params.set("action", action); if (entityId) params.set("entityId", entityId); setLogs((await api<{ logs: AuditLog[] }>(`/api/admin/audit-logs?${params.toString()}`)).logs); };
  useEffect(() => { void load().catch((caught: Error) => setError(caught.message)); }, []);
  const submit = (event: FormEvent) => { event.preventDefault(); void load().catch((caught: Error) => setError(caught.message)); };
  return <div><PageHeader title="Lịch sử hệ thống" description="Theo dõi đăng nhập, thay đổi dữ liệu, xuất PDF, hủy và khôi phục báo giá." /><form className="audit-filter" onSubmit={submit}><label><span>Hành động</span><select value={action} onChange={(event) => setAction(event.target.value)}><option value="">Tất cả</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>ID đối tượng</span><input value={entityId} onChange={(event) => setEntityId(event.target.value)} /></label><button className="button secondary" type="submit"><Search size={16} /> Lọc</button></form>{error && <div className="form-error">{error}</div>}<div className="audit-list">{logs.map((log) => <article key={log.id}><div className="audit-icon">{(actionLabels[log.action] ?? log.action).slice(0, 1)}</div><div><div><strong>{actionLabels[log.action] ?? log.action}</strong><span>{log.actorName}</span></div><p>{log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p><small>{new Date(log.createdAt).toLocaleString("vi-VN")} · Request {log.requestId}</small><details><summary>Xem dữ liệu thay đổi</summary><pre>{JSON.stringify({ old: log.oldData, new: log.newData }, null, 2)}</pre></details></div></article>)}</div>{logs.length === 0 && <div className="empty-state"><strong>Chưa có lịch sử phù hợp</strong></div>}</div>;
}
