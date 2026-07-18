import { handleLead } from "../../src/leads/handler";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleLead(context, "quote");
