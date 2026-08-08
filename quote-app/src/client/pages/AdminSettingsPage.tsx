import { ImageUp, Save } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { AppSettings } from "../../shared/types";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<{ settings: AppSettings }>("/api/admin/settings")
      .then((result) => setSettings(result.settings))
      .catch((caught: Error) => setError(caught.message));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ settings: AppSettings }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(result.settings);
      setMessage("Đã lưu cài đặt mặc định.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu cài đặt.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("logo", file);
    try {
      await api("/api/admin/settings/logo", { method: "POST", body: form });
      setMessage("Đã cập nhật logo. Logo mới sẽ được dùng cho PDF tiếp theo.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải logo.");
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <div className="page-loading"><span />Đang tải cài đặt…</div>;

  return (
    <div>
      <PageHeader title="Cài đặt hệ thống" description="Thông tin được chụp snapshot khi xuất PDF; các PDF cũ không thay đổi." />
      <form className="settings-form" onSubmit={(event) => void save(event)}>
        <section>
          <div className="settings-heading">
            <div><h2>Thông tin công ty</h2><p>Hiển thị ở đầu báo giá và PDF.</p></div>
            <label className="button secondary file-button"><ImageUp size={16} /> Đổi logo<input type="file" accept="image/png,image/jpeg" onChange={(event) => void upload(event)} /></label>
          </div>
          <div className="settings-grid">
            <label className="wide"><span>Tên công ty</span><input value={settings.company.name} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, name: event.target.value } })} /></label>
            <label className="wide"><span>Địa chỉ công ty</span><input value={settings.company.address} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, address: event.target.value } })} /></label>
            <label><span>Điện thoại công ty</span><input value={settings.company.phone} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, phone: event.target.value } })} /></label>
            <label><span>Website</span><input value={settings.company.website} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, website: event.target.value } })} /></label>
            <label><span>Tên liên hệ trên header</span><input value={settings.company.headerContactName} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, headerContactName: event.target.value } })} placeholder="Mr. Tùng" /></label>
            <label><span>SĐT header / Mr. Tùng</span><input value={settings.company.headerPhone} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, headerPhone: event.target.value } })} inputMode="tel" /></label>
          </div>
        </section>

        <section>
          <div className="settings-heading"><div><h2>Ngân hàng & VietQR</h2><p>QR dùng đúng tài khoản và số tiền còn lại, không ép nội dung chuyển khoản.</p></div></div>
          <div className="settings-grid">
            <label><span>Ngân hàng</span><input value={settings.bank.bankCode} onChange={(event) => setSettings({ ...settings, bank: { ...settings.bank, bankCode: event.target.value } })} /></label>
            <label><span>Số tài khoản</span><input value={settings.bank.accountNumber} onChange={(event) => setSettings({ ...settings, bank: { ...settings.bank, accountNumber: event.target.value } })} /></label>
            <label className="wide"><span>Chủ tài khoản</span><input value={settings.bank.holder} onChange={(event) => setSettings({ ...settings, bank: { ...settings.bank, holder: event.target.value } })} /></label>
            <label><span>Tên cửa hàng trên QR</span><input value={settings.bank.store} onChange={(event) => setSettings({ ...settings, bank: { ...settings.bank, store: event.target.value } })} /></label>
          </div>
        </section>

        <section>
          <div className="settings-heading"><div><h2>Mặc định báo giá</h2><p>Nhân viên có thể điều chỉnh ghi chú trên từng báo giá.</p></div></div>
          <div className="settings-grid">
            <label className="wide"><span>Ghi chú giao hàng</span><textarea rows={4} value={settings.defaults.deliveryNote} onChange={(event) => setSettings({ ...settings, defaults: { ...settings.defaults, deliveryNote: event.target.value } })} /></label>
            <label className="wide"><span>Ghi chú chung</span><textarea rows={5} value={settings.defaults.generalNote} onChange={(event) => setSettings({ ...settings, defaults: { ...settings.defaults, generalNote: event.target.value } })} /></label>
          </div>
        </section>

        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
        <div className="settings-save"><button className="button primary" type="submit" disabled={busy}><Save size={16} /> {busy ? "Đang lưu…" : "Lưu cài đặt"}</button></div>
      </form>
    </div>
  );
}
