import { handleHealth } from "../src/oauth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleHealth(context.request);
