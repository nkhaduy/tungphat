import { useEffect, useState } from "react";
import { accessLoginUrl, logout, session, type AdminUser } from "./api";
import { Layout } from "./components/Layout";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ContentScreen } from "./screens/ContentScreen";
import { MediaScreen } from "./screens/MediaScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { DataScreen } from "./screens/DataScreen";

export function App() {
  const [user, setUser] = useState<AdminUser | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [route, setRoute] = useState("dashboard");
  useEffect(() => { session().then((result) => setUser(result.user)).catch(() => setError("Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa.")).finally(() => setLoading(false)); }, []);
  function beginLogin() { window.location.assign(accessLoginUrl()); }
  async function leave() { const result = await logout(); setUser(null); setRoute("dashboard"); window.location.assign(result.logoutUrl); }
  if (!user) return <LoginScreen onLogin={beginLogin} error={error} busy={loading} />;
  let screen = <DashboardScreen />;
  if (["products", "articles", "projects", "pages"].includes(route)) screen = <ContentScreen collection={route} />;
  else if (route === "media") screen = <MediaScreen />;
  else if (["business-settings", "seo-defaults"].includes(route)) screen = <SettingsScreen setting={route} />;
  else if (route === "users" || route === "audit") screen = <DataScreen kind={route} />;
  return <Layout user={user} route={route} onRoute={setRoute} onLogout={leave}>{screen}</Layout>;
}
