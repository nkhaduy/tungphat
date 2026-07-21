import { handleGitGateway } from "../../../src/github/gateway";

export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handleGitGateway(request, env);
