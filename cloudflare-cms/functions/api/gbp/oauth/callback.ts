import { handleGbpOAuthCallback } from "../../../../src/gbp/handler";
export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleGbpOAuthCallback(request, env);
