import { handleSession } from "../../../src/auth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleSession(request, env);
