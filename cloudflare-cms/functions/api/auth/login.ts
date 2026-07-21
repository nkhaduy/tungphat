import { handleLogin } from "../../../src/auth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleLogin(request, env);
