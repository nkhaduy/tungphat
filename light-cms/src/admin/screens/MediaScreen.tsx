import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { StatePanel } from "../components/StatePanel";

export function MediaScreen() {
  const [items, setItems] = useState<unknown[]>([]); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = () => api.media().then((data) => setItems(Array.isArray(data) ? data : data.results || [])).catch((reason: Error) => setError(reason.message));
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const file = form.get("file"); const alt = String(form.get("alt") || ""); if (!(file instanceof File) || !file.size) return; try { const pending = await api.createMedia({ filename: file.name, mimeType: file.type, size: file.size, alt }); await api.uploadMedia(pending.uploadUrl, file); setMessage("Upload và xác minh media thành công."); event.currentTarget.reset(); load(); } catch (reason) { setError((reason as Error).message); } }
  return <><header className="page-heading"><p className="eyebrow">THƯ VIỆN</p><h1>Media</h1><p>File chỉ chuyển sang trạng thái sẵn sàng sau khi R2, MIME, magic bytes và kích thước đều hợp lệ.</p></header><div className="media-layout"><form className="paper-section upload-form" onSubmit={submit}><h2>Tải ảnh mới</h2><label>Chọn ảnh<input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /></label><label>Alt text<input name="alt" minLength={3} required placeholder="Mô tả đúng nội dung ảnh" /></label><button className="primary">Khởi tạo và upload</button>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}</form><section className="paper-section"><h2>File đã quản lý</h2>{items.length ? <pre className="data-preview">{JSON.stringify(items, null, 2)}</pre> : <StatePanel title="Chưa có media" description="Các media được migration sẽ xuất hiện sau khi finalize." />}</section></div></>;
}
