import { useEffect, useState } from "react";
import { api } from "../api";
import { StatePanel } from "../components/StatePanel";

export function SettingsScreen({ setting }: { setting: string }) {
  const [json, setJson] = useState(""); const [version, setVersion] = useState(0); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  useEffect(() => { setJson(""); setError(""); api.settings(setting).then((result) => { setJson(JSON.stringify(result.data, null, 2)); setVersion(result.version); }).catch((reason: Error) => setError(reason.message)); }, [setting]);
  async function save() { try { await api.saveSettings(setting, JSON.parse(json), version); setVersion((value) => value + 1); setMessage("Đã lưu setting."); } catch (reason) { setError((reason as Error).message); } }
  if (!json && error) return <StatePanel title="Chưa tải được setting" description={error} tone="error" />;
  return <><header className="page-heading"><p className="eyebrow">CẤU HÌNH</p><h1>{setting}</h1><p>Mọi thay đổi được validate bằng shared Zod contract trước khi ghi.</p></header><section className="editor-panel standalone"><label className="editor-field">Dữ liệu JSON<textarea rows={26} value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} /></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="primary" onClick={save}>Lưu setting · v{version}</button></section></>;
}
