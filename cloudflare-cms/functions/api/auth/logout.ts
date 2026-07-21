import { handleLogout } from "../../../src/auth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleLogout(request, env);
