import { handleAdminGbp } from "../../../../src/gbp/handler";
export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleAdminGbp(context);
