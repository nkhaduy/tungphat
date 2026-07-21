import { handleGatewayStatus } from "../../../src/auth/handlers";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleGatewayStatus(request, env);
