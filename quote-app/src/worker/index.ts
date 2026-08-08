import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  auditLogsHandler,
  createBranchHandler,
  createUserHandler,
  dashboardHandler,
  listBranchesHandler,
  listUsersHandler,
  deleteUserHandler,
  viewUserPasswordHandler,
  updateBranchHandler,
  updateUserHandler,
} from "./admin";
import {
  authenticate,
  changePasswordHandler,
  issueLoginCsrf,
  login,
  logout,
  requireAdmin,
  requireMutation,
  requirePasswordChanged,
  resolveAuthenticatedUser,
  sessionInfo,
  type AppBindings,
} from "./auth";
import { HttpError, noStore } from "./http";
import { listCustomersHandler } from "./customers";
import { downloadVersionHandler, exportPdfHandler, listVersionsHandler } from "./pdf";
import {
  cancelQuoteHandler,
  createQuoteHandler,
  duplicateQuoteHandler,
  deleteQuoteHandler,
  archiveQuoteHandler,
  getQuoteHandler,
  listQuotesHandler,
  restoreQuoteHandler,
  updateQuoteHandler,
} from "./quotes";
import { getSettings, getSettingsHandler, serveLogoHandler, updateSettingsHandler, uploadLogoHandler } from "./settings";
import { CMS_SSO_CALLBACK, cmsSsoForm, signCmsAssertion } from "./sso";

export const app = new Hono<AppBindings>();

app.use("/api/*", bodyLimit({
  maxSize: 3 * 1024 * 1024,
  onError: (c) => c.json({ ok: false, message: "Dữ liệu gửi lên vượt quá giới hạn cho phép." }, 413),
}));

app.use("/api/*", async (c, next) => {
  const requestId = c.req.header("CF-Ray") ?? crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true, service: "tung-phat-quotes" }));
app.get("/api/auth/csrf", issueLoginCsrf);
app.post("/api/auth/login", login);
app.get("/api/auth/sso/cms", async (c) => {
  noStore(c);
  const state = c.req.query("state") ?? "";
  if (!/^[A-Za-z0-9_-]{32,128}$/u.test(state)) throw new HttpError(422, "Yêu cầu đăng nhập CMS không hợp lệ.");
  const continuation = `/api/auth/sso/cms?state=${state}`;
  const resolved = await resolveAuthenticatedUser(c.req.raw, c.env);
  if (!resolved) return c.redirect(`/login?returnTo=${encodeURIComponent(continuation)}`, 302);
  if (resolved.user.mustChangePassword) return c.redirect(`/doi-mat-khau?returnTo=${encodeURIComponent(continuation)}`, 302);
  if (resolved.user.role !== "ADMIN") throw new HttpError(403, "Bạn chưa được cấp quyền quản trị CMS.");
  return cmsSsoForm(await signCmsAssertion(resolved.user, c.env), state, CMS_SSO_CALLBACK);
});

app.use("/api/*", authenticate);
app.get("/api/auth/session", sessionInfo);
app.post("/api/auth/logout", requireMutation, logout);
app.post("/api/auth/change-password", requireMutation, changePasswordHandler);
app.use("/api/*", requirePasswordChanged);

app.get("/api/meta", async (c) => {
  const [settings, branches] = await Promise.all([
    getSettings(c.env),
    c.env.DB.prepare("SELECT id,code,name,address,phone FROM branches WHERE is_active=1 AND deleted_at IS NULL AND code IN ('TP14','TP81') ORDER BY code")
      .all<{ id: string; code: string; name: string; address: string; phone: string }>(),
  ]);
  return c.json({ settings, branches: branches.results });
});
app.get("/api/settings/logo", serveLogoHandler);
app.get("/api/customers", listCustomersHandler);

app.get("/api/quotes", listQuotesHandler);
app.post("/api/quotes", requireMutation, createQuoteHandler);
app.get("/api/quotes/:id", getQuoteHandler);
app.put("/api/quotes/:id", requireMutation, updateQuoteHandler);
app.post("/api/quotes/:id/pdf", requireMutation, exportPdfHandler);
app.post("/api/quotes/:id/archive", requireMutation, archiveQuoteHandler);
app.get("/api/quotes/:id/versions", listVersionsHandler);
app.get("/api/quote-versions/:versionId/pdf", downloadVersionHandler);

app.use("/api/admin/*", requireAdmin);
app.get("/api/admin/dashboard", dashboardHandler);
app.get("/api/admin/users", listUsersHandler);
app.post("/api/admin/users", requireMutation, createUserHandler);
app.put("/api/admin/users/:id", requireMutation, updateUserHandler);
app.get("/api/admin/users/:id/password", viewUserPasswordHandler);
app.delete("/api/admin/users/:id", requireMutation, deleteUserHandler);
app.get("/api/admin/branches", listBranchesHandler);
app.post("/api/admin/branches", requireMutation, createBranchHandler);
app.put("/api/admin/branches/:id", requireMutation, updateBranchHandler);
app.get("/api/admin/settings", getSettingsHandler);
app.put("/api/admin/settings", requireMutation, updateSettingsHandler);
app.post("/api/admin/settings/logo", requireMutation, uploadLogoHandler);
app.get("/api/admin/audit-logs", auditLogsHandler);
app.post("/api/admin/quotes/:id/cancel", requireMutation, cancelQuoteHandler);
app.post("/api/admin/quotes/:id/restore", requireMutation, restoreQuoteHandler);
app.post("/api/admin/quotes/:id/duplicate", requireMutation, duplicateQuoteHandler);
app.delete("/api/admin/quotes/:id", requireMutation, deleteQuoteHandler);

app.notFound((c) => c.json({ ok: false, message: "Không tìm thấy tài nguyên." }, 404));
app.onError((error, c) => {
  if (error instanceof HttpError) return c.json({ ok: false, message: error.message }, error.status);
  console.error(JSON.stringify({
    message: "unhandled_error",
    error: error instanceof Error ? error.message : String(error),
    path: c.req.path,
    requestId: c.get("requestId"),
  }));
  return c.json({ ok: false, message: "Hệ thống gặp lỗi. Vui lòng thử lại." }, 500);
});

export default {
  async fetch(request: Request, env: QuoteAppEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return app.fetch(request, env, ctx);
    if (url.pathname.endsWith(".map")) return new Response("Not found", { status: 404 });
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== "GET" || !request.headers.get("Accept")?.includes("text/html")) return asset;
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  },
} satisfies ExportedHandler<QuoteAppEnv>;
