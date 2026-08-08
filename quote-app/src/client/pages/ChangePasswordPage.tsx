import { KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { safeSsoReturn } from "../sso-return";

export function ChangePasswordPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const returnTo = safeSsoReturn(window.location.search);

  if (!user) return <Navigate to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      await refresh();
      if (returnTo) window.location.assign(returnTo);
      else void navigate(user.role === "ADMIN" ? "/admin" : "/bao-gia", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đổi mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel password-change-panel" aria-labelledby="change-password-title">
        <div className="password-change-icon"><ShieldCheck size={28} /></div>
        <h1 id="change-password-title">Đổi mật khẩu lần đầu</h1>
        <p>Bạn cần đặt mật khẩu riêng trước khi sử dụng hệ thống báo giá.</p>
        <form onSubmit={(event) => void submit(event)}>
          <label><span>Mật khẩu hiện tại</span><div className="input-icon"><KeyRound size={18} /><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required autoFocus /></div></label>
          <label><span>Mật khẩu mới</span><div className="input-icon"><KeyRound size={18} /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={10} required /></div></label>
          <label><span>Nhập lại mật khẩu mới</span><div className="input-icon"><KeyRound size={18} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={10} required /></div></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button primary login-button" type="submit" disabled={submitting}>{submitting ? "Đang đổi mật khẩu…" : "Xác nhận mật khẩu mới"}</button>
        </form>
      </section>
    </main>
  );
}
