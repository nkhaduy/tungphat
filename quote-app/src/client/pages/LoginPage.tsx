import { LockKeyhole, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { api, setCsrfToken } from "../api";
import { useAuth } from "../auth";
import type { SessionUser } from "../../shared/types";

export function LoginPage() {
  const { user, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={user.mustChangePassword ? "/doi-mat-khau" : user.role === "ADMIN" ? "/admin" : "/bao-gia"} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const csrf = await api<{ csrf: string }>("/api/auth/csrf");
      const result = await api<{ user: SessionUser; csrf: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, csrf: csrf.csrf }),
      });
      setCsrfToken(result.csrf);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand"><img src="/logo-horizontal.png" alt="Tùng Phát" /></div>
        <h1 id="login-title">Đăng nhập</h1>
        <form onSubmit={(event) => void submit(event)}>
          <label><span>Tên đăng nhập</span><div className="input-icon"><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus /></div></label>
          <label><span>Mật khẩu</span><div className="input-icon"><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button primary login-button" type="submit" disabled={submitting}>{submitting ? "Đang đăng nhập…" : "Đăng nhập"}</button>
        </form>
      </section>
    </main>
  );
}
