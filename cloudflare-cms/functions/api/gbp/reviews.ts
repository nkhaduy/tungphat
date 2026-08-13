import { handlePublicReviews } from "../../../src/gbp/handler";
export const onRequest: PagesFunction<CloudflareCmsEnv> = ({ request, env }) => handlePublicReviews(request, env);
