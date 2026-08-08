export type StagingResourceNames = { environment: string; worker: string; pages: string; d1: string; r2: string };

const forbidden = /(tung[-_]phat[-_]leads|tung[-_]phat[-_]quotes|tungphat-payload|tung[-_]phat-media(?:-preview)?$|tungphat-cms$|production|payload)/i;

export function assertStagingResources(resources: StagingResourceNames) {
  if (resources.environment !== "staging") throw new Error("Only staging environment is allowed");
  for (const [label, value] of Object.entries(resources)) {
    if (label === "environment") continue;
    if (!value.endsWith("staging")) throw new Error(`${label} must end with staging`);
    if (forbidden.test(value)) throw new Error(`${label} uses a forbidden production/shared resource`);
  }
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertStagingResources({
    environment: process.env.LIGHT_CMS_ENVIRONMENT || "staging",
    worker: process.env.LIGHT_CMS_WORKER || "tungphat-light-cms-api-20260805-0855-staging",
    pages: process.env.LIGHT_CMS_PAGES || "tungphat-light-cms-20260805-0855-staging",
    d1: process.env.LIGHT_CMS_D1 || "tungphat-light-cms-20260805-0855-staging",
    r2: process.env.LIGHT_CMS_R2 || "tungphat-light-media-20260805-0855-staging",
  });
  console.log("Light CMS staging resource guard: PASS");
}
