import { handleLoginCsrf } from "../../../src/auth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleLoginCsrf(request, env);
