import { handleLead } from "../_lib/leads";
export const onRequest: PagesFunction<CloudflareEnv> = (context) => handleLead(context, "contact");
