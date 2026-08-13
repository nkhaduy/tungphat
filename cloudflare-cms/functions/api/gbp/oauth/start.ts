import { handleGbpOAuthStart } from "../../../../src/gbp/handler";
export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleGbpOAuthStart(request, env);
