import { handleAnalyticsTrack } from "../../../src/analytics/collector";

export const onRequest: PagesFunction<CloudflareCmsEnv> = (context) => handleAnalyticsTrack(context);
