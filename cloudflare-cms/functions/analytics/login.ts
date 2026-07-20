import { handleAuth } from "../../src/oauth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleAuth(context.request, context.env);
