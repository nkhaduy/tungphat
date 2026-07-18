import { handleLead } from "../../cloudflare-cms/src/leads/handler";
export const onRequest: PagesFunction<CloudflareEnv> = (context) => handleLead(context, "quote");
