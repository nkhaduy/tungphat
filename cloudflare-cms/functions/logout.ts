import { handleLogout } from "../src/oauth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleLogout(context.request, context.env);
