import { hasValidAdminSession } from "../../src/oauth/admin-session";

export const onRequest: PagesFunction<CloudflareCmsEnv> = async (context) => {
  if (new URL(context.request.url).pathname === "/analytics/login") {
    return context.next();
  }
  if (!(await hasValidAdminSession(context.request, context.env.OAUTH_STATE_SECRET))) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/analytics/login",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }
  const response = await context.next();
  const secured = new Response(response.body, response);
  secured.headers.set("Cache-Control", "private, no-store");
  secured.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  secured.headers.set("X-Frame-Options", "DENY");
  return secured;
};
