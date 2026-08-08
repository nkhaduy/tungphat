import { Store } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { OFFICIAL_BRANCHES } from "../../shared/branches";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

type Branch = { id: string; code: string; name: string; address: string; phone: string; isActive: boolean; userCount: number };
type BranchForm = Pick<Branch, "code" | "name" | "address" | "phone" | "isActive">;

export function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>({ ...OFFICIAL_BRANCHES[0], isActive: true });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const result = await api<{ branches: Branch[] }>("/api/admin/branches");
    setBranches(result.branches);
    if (!selected && result.branches[0]) {
      setSelected(result.branches[0].id);
      setForm(result.branches[0]);
    }
  };
  useEffect(() => { void load().catch((caught: Error) => setError(caught.message)); }, []);

  const reset = () => {
    const next = branches[0];
    if (!next) return;
    setSelected(next.id);
    setForm(next);
    setError("");
    setMessage("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setError("");
    try {
      await api(`/api/admin/branches/${selected}`, { method: "PUT", body: JSON.stringify(form) });
      setMessage("Đã lưu thông tin chi nhánh.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu chi nhánh.");
    }
  };

  return (
    <div>
      <PageHeader title="Chi nhánh" description="Hệ thống chỉ sử dụng hai chi nhánh chính thức và mã TP14/TP81." actions={<button className="button secondary" type="button" onClick={reset}><Store size={16} /> Chọn lại</button>} />
      <div className="management-split">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Mã</th><th>Tên chi nhánh</th><th>Địa chỉ</th><th>Điện thoại</th><th>Nhân viên</th><th>Trạng thái</th></tr></thead>
            <tbody>{branches.map((branch) => <tr key={branch.id} onClick={() => { setSelected(branch.id); setForm(branch); setMessage(""); }} className={selected === branch.id ? "selected-row" : ""}><td><strong>{branch.code}</strong></td><td>{branch.name}</td><td>{branch.address}</td><td>{branch.phone || "—"}</td><td>{branch.userCount}</td><td><span className={branch.isActive ? "active-state" : "inactive-state"}>{branch.isActive ? "Hoạt động" : "Tạm khóa"}</span></td></tr>)}</tbody>
          </table>
        </div>
        <form className="management-form" onSubmit={(event) => void submit(event)}>
          <h2>Thông tin chi nhánh</h2>
          <label><span>Mã chi nhánh</span><input value={form.code} readOnly /></label>
          <label><span>Tên chi nhánh</span><input value={form.name} readOnly /></label>
          <label><span>Địa chỉ</span><textarea rows={3} value={form.address} readOnly /></label>
          <label><span>Điện thoại chi nhánh</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} inputMode="tel" /></label>
          <label className="toggle-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Đang hoạt động</span></label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="button primary" type="submit" disabled={!selected}>Lưu chi nhánh</button>
        </form>
      </div>
    </div>
  );
}
