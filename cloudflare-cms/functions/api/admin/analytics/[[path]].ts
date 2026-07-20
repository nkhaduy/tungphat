import { handleAdminAnalytics } from "../../../../src/analytics/admin-handler";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleAdminAnalytics(context);
