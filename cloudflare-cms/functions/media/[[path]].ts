import { handleMedia } from "../../src/media/handler";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleMedia(context.request, context.env);
