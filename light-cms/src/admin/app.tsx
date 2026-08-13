import { useEffect, useState } from "react";
import { ApiRequestError, logout, session, ssoLoginUrl, type AdminUser } from "./api";
import { Layout } from "./components/Layout";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ContentScreen } from "./screens/ContentScreen";
import { MediaScreen } from "./screens/MediaScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { DataScreen } from "./screens/DataScreen";
import { HomepageScreen } from "./screens/HomepageScreen";
import { GbpScreen } from "./screens/GbpScreen";

export function App() {
  const [user, setUser] = useState<AdminUser | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [route, setRoute] = useState("dashboard");
  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    void session().then((result) => setUser(result.user)).catch((reason: unknown) => {
      if (reason instanceof ApiRequestError && reason.status === 401 && !authError) {
        window.location.assign(ssoLoginUrl());
        return;
      }
      setError(reason instanceof ApiRequestError && reason.status === 403 ? "Bạn chưa được cấp quyền quản trị." : "Không thể hoàn tất đăng nhập. Vui lòng thử lại.");
    }).finally(() => setLoading(false));
  }, []);
  function beginLogin() { window.location.assign(ssoLoginUrl()); }
  async function leave() { await logout(); setUser(null); setRoute("dashboard"); }
  if (!user) return <LoginScreen onLogin={beginLogin} error={error} busy={loading} />;
  let screen = <DashboardScreen />;
  if (route === "homepage") screen = <HomepageScreen />;
  else if (["products", "articles", "projects", "pages"].includes(route)) screen = <ContentScreen collection={route} />;
  else if (route === "media") screen = <MediaScreen />;
  else if (route === "gbp") screen = <GbpScreen />;
  else if (route === "business-settings") screen = <SettingsScreen setting="business-settings" />;
  else if (route === "users" || route === "versions" || route === "audit") screen = <DataScreen kind={route} />;
  return <Layout user={user} route={route} onRoute={setRoute} onLogout={leave}>{screen}</Layout>;
}
