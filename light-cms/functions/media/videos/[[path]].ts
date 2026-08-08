import { proxyLegacyRequest } from "../../_shared/legacy-proxy";

interface PagesEnv { LEGACY_CMS_ORIGIN?: string; LIGHT_CMS_GATEWAY?: string }

export const onRequest: PagesFunction<PagesEnv> = ({ request, env }) => {
  if (!env.LEGACY_CMS_ORIGIN) return new Response("Legacy media origin is not configured", { status: 503 });
  return proxyLegacyRequest(request, env.LEGACY_CMS_ORIGIN, env.LIGHT_CMS_GATEWAY || "pages-production");
};
