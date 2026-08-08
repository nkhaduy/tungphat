import { Eye, EyeOff, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

type UserItem = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: "ADMIN" | "EMPLOYEE";
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  hasViewablePassword: boolean;
};
type Branch = { id: string; code: string; name: string };
type UserForm = { username: string; fullName: string; phone: string; password: string; role: "ADMIN" | "EMPLOYEE"; branchId: string; isActive: boolean };
const empty: UserForm = { username: "", fullName: "", phone: "", password: "", role: "EMPLOYEE", branchId: "", isActive: true };

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [revealedPassword, setRevealedPassword] = useState<{ id: string; value: string } | null>(null);

  const load = async () => {
    const [userResult, meta] = await Promise.all([
      api<{ users: UserItem[] }>("/api/admin/users"),
      api<{ branches: Branch[] }>("/api/meta"),
    ]);
    setUsers(userResult.users);
    setBranches(meta.branches);
  };
  useEffect(() => { void load().catch((caught: Error) => setError(caught.message)); }, []);

  const select = (user: UserItem) => {
    setSelectedId(user.id);
    setForm({ username: user.username, fullName: user.fullName, phone: user.phone, password: "", role: user.role, branchId: user.branchId ?? "", isActive: user.isActive });
    setMessage("");
    setError("");
  };
  const reset = () => {
    setSelectedId(null);
    setForm({ ...empty, branchId: branches.find((branch) => branch.code === "TP81")?.id ?? branches[0]?.id ?? "" });
    setMessage("");
    setError("");
  };
  const revealPassword = async (id: string) => {
    setError("");
    try {
      const result = await api<{ password: string }>(`/api/admin/users/${id}/password`);
      setRevealedPassword({ id, value: result.password });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xem mật khẩu."); }
  };
  const deleteUser = async () => {
    if (!selectedId || !window.confirm("Xóa nhân viên này khỏi danh sách? Dữ liệu báo giá vẫn được giữ nguyên.")) return;
    try {
      await api(`/api/admin/users/${selectedId}`, { method: "DELETE" });
      setRevealedPassword(null);
      reset();
      setMessage("Đã xóa nhân viên (soft-delete).");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa nhân viên."); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await api(selectedId ? `/api/admin/users/${selectedId}` : "/api/admin/users", {
        method: selectedId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, branchId: form.branchId || null, password: form.password || undefined }),
      });
      setMessage(selectedId ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản.");
      await load();
      if (!selectedId) reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu tài khoản.");
    }
  };

  return (
    <div>
      <PageHeader title="Nhân viên" description="Hồ sơ nhân viên được dùng trên báo giá và PDF." actions={<button className="button primary" type="button" onClick={reset}><UserPlus size={16} /> Thêm nhân viên</button>} />
      <div className="management-split">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nhân viên</th><th>Số điện thoại</th><th>Tài khoản</th><th>Vai trò</th><th>Chi nhánh</th><th>Đăng nhập gần nhất</th><th>Trạng thái</th><th>Mật khẩu</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id} onClick={() => select(user)} className={selectedId === user.id ? "selected-row" : ""}><td><strong>{user.fullName}</strong></td><td>{user.phone || "—"}</td><td>{user.username}</td><td>{user.role === "ADMIN" ? "Admin" : "Nhân viên"}</td><td>{user.branchName ?? "—"}</td><td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}</td><td><span className={user.isActive ? "active-state" : "inactive-state"}>{user.isActive ? "Đang hoạt động" : "Đã khóa"}</span></td><td>{user.role === "EMPLOYEE" && user.hasViewablePassword ? <button type="button" className="icon-button" aria-label={revealedPassword?.id === user.id ? "Ẩn mật khẩu" : "Xem mật khẩu"} onClick={(event) => { event.stopPropagation(); if (revealedPassword?.id === user.id) setRevealedPassword(null); else void revealPassword(user.id); }}>{revealedPassword?.id === user.id ? <EyeOff size={16} /> : <Eye size={16} />}</button> : "—"}{revealedPassword?.id === user.id && <code className="revealed-password">{revealedPassword.value}</code>}</td></tr>)}</tbody>
          </table>
        </div>
        <form className="management-form" onSubmit={(event) => void submit(event)}>
          <h2>{selectedId ? "Cập nhật tài khoản" : "Tạo tài khoản"}</h2>
          <label><span>Họ và tên</span><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
          <label><span>Số điện thoại</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} inputMode="tel" placeholder="0909 xxx xxx" /></label>
          <label><span>Tên đăng nhập</span><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>
          <label><span>{selectedId ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu"}</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!selectedId} minLength={10} /></label>
          <label><span>Vai trò</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm["role"] })}><option value="EMPLOYEE">Nhân viên</option><option value="ADMIN">Admin</option></select></label>
          <label><span>Chi nhánh</span><select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}><option value="">Không gắn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <label className="toggle-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Cho phép đăng nhập</span></label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <div className="management-form-actions"><button className="button primary" type="submit">{selectedId ? "Lưu thay đổi" : "Tạo tài khoản"}</button>{selectedId && form.role === "EMPLOYEE" && <button className="button danger" type="button" onClick={() => void deleteUser()}><Trash2 size={16} /> Xóa nhân viên</button>}</div>
        </form>
      </div>
    </div>
  );
}
