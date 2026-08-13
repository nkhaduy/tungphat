import { cloneGatewayRequest, gatewayHeaders, proxyLegacyRequest } from "../_shared/legacy-proxy";
import { adminGbp, cronGbp, oauthAuthorize, oauthCallback, oauthStart, publicReviews, type PagesGbpEnv } from "../_shared/gbp-handler";

interface PagesEnv extends PagesGbpEnv { LEGACY_CMS_ORIGIN?: string; LIGHT_CMS_GATEWAY?: string }

const lightCmsPrefixes = [
  "/api/auth/sso/start",
  "/api/auth/sso/callback",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/dashboard",
  "/api/users",
  "/api/preview",
  "/api/media",
  "/api/settings",
  "/api/versions",
  "/api/audit",
  "/api/public/snapshot",
  "/api/public/media/",
  "/api/products",
  "/api/articles",
  "/api/projects",
  "/api/pages",
];

function isLightCmsPath(pathname: string) {
  return lightCmsPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const onRequest: PagesFunction<PagesEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/gbp/reviews") return publicReviews(request, env);
  if (url.pathname === "/api/gbp/oauth/start") return oauthStart(request, env);
  if (url.pathname === "/api/gbp/oauth/authorize") return oauthAuthorize(request, env);
  if (url.pathname === "/api/gbp/oauth/callback") return oauthCallback(request, env);
  if (url.pathname === "/api/gbp/cron") return cronGbp(request, env);
  if (url.pathname === "/api/admin/gbp" || url.pathname.startsWith("/api/admin/gbp/")) return adminGbp(request, env);
  const gateway = env.LIGHT_CMS_GATEWAY || "pages-staging";
  if (env.LEGACY_CMS_ORIGIN && !isLightCmsPath(url.pathname)) {
    return proxyLegacyRequest(request, env.LEGACY_CMS_ORIGIN, gateway);
  }
  return env.LIGHT_CMS_API.fetch(cloneGatewayRequest(request, request.url, gatewayHeaders(request, gateway)));
};
