import { handleCallback } from "../src/oauth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleCallback(context.request, context.env);
