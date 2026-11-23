import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export const PRODUCTION_RELEASE_BRANCH = "codex/editorial-cms-release";
export const PRODUCTION_CMS_ORIGIN = "https://cms.mdftungphat.com";
export const PRODUCTION_SITE_ORIGIN = "https://gotungphat.com";
const STATE_DIRECTORY = ".workers-build";
const STATE_FILE = "production-state.json";
const MAX_ARTICLES = 50;
const MAX_CONVERGENCE_ATTEMPTS = 3;
const MAX_EDGE_PROBE_ATTEMPTS = 14;

export type ProductionBuildEnvironment = {
  branch: string;
  buildId: string;
  commitSha: string;
  cmsOrigin: string;
  siteOrigin: string;
  callbackSecret: string;
};

type Article = Record<string, unknown> & { slug: string; title: string; _status: "published" };
type BuildContext = {
  branch: string;
  articleSlug: string | null;
  triggerReason: string | null;
  requestId: string;
  ready?: boolean;
};
type ProductionBuildState = {
  buildId: string;
  branch: string;
  commitSha: string;
  articleDigest: string;
  articles: Array<{ slug: string; title: string }>;
  trigger: BuildContext;
};

export function productionArtifactIsCurrent(input: {
  artifactDigest: string;
  latestDigest: string;
  artifactRequestId: string;
  latestRequestId: string;
}) {
  return input.artifactDigest === input.latestDigest && input.artifactRequestId === input.latestRequestId;
}

export async function retryUntilProductionRouteRemoved(
  probe: (attempt: number) => Promise<number>,
  options: { attempts?: number; wait?: (delayMs: number) => Promise<void> } = {},
) {
  const attempts = Math.max(1, Math.floor(options.attempts ?? MAX_EDGE_PROBE_ATTEMPTS));
  const wait = options.wait ?? ((delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let status = 0;
    try { status = await probe(attempt); } catch { /* Retry transient edge failures within the bound. */ }
    if (status === 404 || status === 410) return true;
    if (attempt < attempts) await wait(Math.min(attempt * 1500, 5000));
  }
  return false;
}

export function validateProductionBuildEnvironment(
  env: Record<string, string | undefined>,
  checkedOutSha = readCheckedOutCommitSha(process.cwd()),
) {
  if (env.STATIC_BUILD_TARGET !== "production" || env.WORKERS_CI !== "1") {
    throw new Error("This command is restricted to a Workers Builds production job.");
  }
  if (env.WORKERS_CI_BRANCH !== PRODUCTION_RELEASE_BRANCH) {
    throw new Error(`Production builds are restricted to release branch ${PRODUCTION_RELEASE_BRANCH}.`);
  }
  const buildId = env.WORKERS_CI_BUILD_UUID || "";
  if (!isUUID(buildId)) throw new Error("Workers Builds did not provide a valid build UUID.");

  const commitSha = resolveProductionCommitSha(env.WORKERS_CI_COMMIT_SHA, checkedOutSha);
  const cmsOrigin = exactHttpsOrigin(env.PAYLOAD_CMS_URL, PRODUCTION_CMS_ORIGIN, "production CMS");
  const siteOrigin = exactHttpsOrigin(env.NEXT_PUBLIC_SITE_ORIGIN, PRODUCTION_SITE_ORIGIN, "production site");
  exactHttpsOrigin(env.SEO_SITE_URL, PRODUCTION_SITE_ORIGIN, "production SEO site");
  if (env.BLOG_CONTENT_PROVIDER !== "payload") throw new Error("Production builds must read editorial content from Payload.");
  if (env.PAYLOAD_ARTICLES_URL?.trim() || env.NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL?.trim()) {
    throw new Error("Production builds must not receive staging CMS or preview media origins.");
  }
  if (env.NEXT_PUBLIC_ANALYTICS_TEST_MODE === "1") {
    throw new Error("Production builds must not use the analytics test mode.");
  }

  const callbackSecret = env.SITE_BUILD_CALLBACK_SECRET || "";
  if (callbackSecret.length < 48) throw new Error("Workers Builds is missing the private CMS status callback secret.");
  return { branch: PRODUCTION_RELEASE_BRANCH, buildId, commitSha, cmsOrigin, siteOrigin, callbackSecret };
}

export function productionDeploymentArguments(buildId: string) {
  if (!isUUID(buildId)) throw new Error("Production deployment requires a valid Workers Build UUID.");
  return ["deploy", "--config", "wrangler.static-production.jsonc", "--message", `CMS publish ${buildId}`];
}

export function resolveProductionCommitSha(workersBuildSha: string | undefined, checkedOutSha: string | undefined) {
  const systemSha = workersBuildSha?.trim() || "";
  const checkoutSha = checkedOutSha?.trim() || "";
  const validSystemSha = /^[a-f0-9]{40}$/iu.test(systemSha);
  const validCheckoutSha = /^[a-f0-9]{40}$/iu.test(checkoutSha);

  if (validSystemSha && validCheckoutSha && systemSha.toLowerCase() !== checkoutSha.toLowerCase()) {
    throw new Error("Workers Builds commit SHA does not match the checked-out revision.");
  }
  if (validSystemSha) return systemSha.toLowerCase();
  if (validCheckoutSha) return checkoutSha.toLowerCase();
  throw new Error("Workers Builds did not provide a valid commit SHA and the checked-out revision is unavailable.");
}

function readCheckedOutCommitSha(root: string) {
  try {
    const head = readFileSync(`${root}/.git/HEAD`, "utf8").trim();
    if (!head.startsWith("ref: ")) return head;
    const ref = head.slice(5);
    return readFileSync(`${root}/.git/${ref}`, "utf8").trim();
  } catch {
    return undefined;
  }
}

function exactHttpsOrigin(value: string | undefined, expected: string, label: string) {
  let url: URL;
  try { url = new URL(value || ""); }
  catch { throw new Error(`Production builds require the configured ${label} HTTPS origin.`); }
  if (url.protocol !== "https:" || url.origin !== expected || url.pathname !== "/" || url.username || url.password || url.search || url.hash) {
    throw new Error(`Production builds may only use the configured ${label} origin.`);
  }
  return url.origin;
}

function isUUID(value: string) {
  return /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu.test(value);
}

function buildEnvironment(env: Record<string, string | undefined>) {
  return validateProductionBuildEnvironment(env);
}

async function runProductionBuild(root: string, env: Record<string, string | undefined>) {
  const context = buildEnvironment(env);
  await postBuildEvent(context, "building");
  const trigger = await waitForBuildContext(context);
  await createStableProductionArtifact(root, env, context, trigger);
}

async function deployProduction(root: string, env: Record<string, string | undefined>) {
  const context = buildEnvironment(env);
  const statePath = path.join(root, STATE_DIRECTORY, STATE_FILE);
  let state = await readState(statePath);
  assertStateMatchesBuild(state, context);

  const wrangler = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
  const config = "wrangler.static-production.jsonc";
  const previousVersion = currentActiveDeploymentVersion(await capture(wrangler, ["deployments", "list", "--config", config, "--json"], root, productionBuildEnvironment(env, context)));
  if (!previousVersion) throw new Error("Could not identify the active production Worker version; refusing deployment without rollback target.");

  let deployStarted = false;
  try {
    for (let attempt = 0; attempt < MAX_CONVERGENCE_ATTEMPTS; attempt += 1) {
      const latestContext = await fetchBuildContext(context);
      const latestArticles = await fetchPublishedArticles(context.cmsOrigin);
      if (!latestContext || !productionArtifactIsCurrent({
        artifactDigest: state.articleDigest,
        latestDigest: publicArticleDigest(latestArticles),
        artifactRequestId: state.trigger.requestId,
        latestRequestId: latestContext.requestId,
      })) {
        state = await rebuildOwnedArtifact(root, env, context, latestContext || state.trigger, statePath);
      }

      await postBuildEvent(context, "deploying", undefined, state.trigger.requestId);
      deployStarted = true;
      await run(wrangler, productionDeploymentArguments(context.buildId), root, productionBuildEnvironment(env, context));
      await verifyProduction(context, state);

      const afterContext = await fetchBuildContext(context);
      const afterArticles = await fetchPublishedArticles(context.cmsOrigin);
      if (!afterContext || !productionArtifactIsCurrent({
        artifactDigest: state.articleDigest,
        latestDigest: publicArticleDigest(afterArticles),
        artifactRequestId: state.trigger.requestId,
        latestRequestId: afterContext.requestId,
      })) {
        if (attempt + 1 === MAX_CONVERGENCE_ATTEMPTS) break;
        state = await rebuildOwnedArtifact(root, env, context, afterContext || state.trigger, statePath);
        continue;
      }

      if (await postBuildEvent(context, "live", undefined, state.trigger.requestId)) return;
      if (attempt + 1 === MAX_CONVERGENCE_ATTEMPTS) break;
      const refreshed = await fetchBuildContext(context);
      state = await rebuildOwnedArtifact(root, env, context, refreshed || state.trigger, statePath);
    }
    throw new Error("Production content changed repeatedly while the Worker deployment was being verified.");
  } catch (error) {
    if (deployStarted) {
      try {
        await run(wrangler, ["rollback", previousVersion, "--config", config, "--message", "Automatic rollback after production content verification failure", "--yes"], root, productionBuildEnvironment(env, context));
      } catch (rollbackError) {
        console.error("Automatic production rollback failed:", errorMessage(rollbackError));
      }
    }
    await postBuildEvent(context, "failed", "production_probe_failed").catch((callbackError) => console.error("Could not report production build failure to Payload CMS:", errorMessage(callbackError)));
    throw error;
  }
}

async function createStableProductionArtifact(
  root: string,
  env: Record<string, string | undefined>,
  context: ProductionBuildEnvironment,
  initialContext: BuildContext,
): Promise<ProductionBuildState> {
  let trigger = initialContext;
  for (let attempt = 0; attempt < MAX_CONVERGENCE_ATTEMPTS; attempt += 1) {
    trigger = await fetchBuildContext(context) || trigger;
    if (trigger.branch !== context.branch) throw new Error("CMS build record does not match the authorized production release branch.");
    const before = await fetchPublishedArticles(context.cmsOrigin);
    const beforeDigest = publicArticleDigest(before);
    await run("npm", ["run", "build"], root, productionBuildEnvironment(env, context, trigger));
    const after = await fetchPublishedArticles(context.cmsOrigin);
    const afterDigest = publicArticleDigest(after);
    const latestContext = await fetchBuildContext(context);
    if (!latestContext || !productionArtifactIsCurrent({
      artifactDigest: beforeDigest,
      latestDigest: afterDigest,
      artifactRequestId: trigger.requestId,
      latestRequestId: latestContext.requestId,
    })) {
      trigger = latestContext || trigger;
      continue;
    }

    await validateProductionOutput(root, after, latestContext);
    await run("node", ["scripts/prepare-workers-production-artifact.mjs"], root, productionBuildEnvironment(env, context));
    const state: ProductionBuildState = {
      buildId: context.buildId,
      branch: context.branch,
      commitSha: context.commitSha,
      articleDigest: afterDigest,
      articles: after.map(({ slug, title }) => ({ slug, title })),
      trigger: latestContext,
    };
    await mkdir(path.join(root, STATE_DIRECTORY), { recursive: true, mode: 0o700 });
    await writeFile(path.join(root, STATE_DIRECTORY, STATE_FILE), JSON.stringify(state), { mode: 0o600 });
    return state;
  }
  throw new Error("Production Payload content changed repeatedly while the static artifact was being built.");
}

async function rebuildOwnedArtifact(
  root: string,
  env: Record<string, string | undefined>,
  context: ProductionBuildEnvironment,
  trigger: BuildContext,
  statePath: string,
) {
  const previous = await readState(statePath);
  assertStateMatchesBuild(previous, context);
  await rm(path.join(root, ".wrangler", "workers-production-assets"), { recursive: true, force: true });
  await rm(statePath, { force: true });
  return createStableProductionArtifact(root, env, context, trigger);
}

async function validateProductionOutput(root: string, articles: Article[], trigger: BuildContext) {
  const sitemap = await readFile(path.join(root, "out", "sitemap.xml"), "utf8").catch(() => "");
  if (!sitemap || !sitemap.includes("<urlset")) throw new Error("Production static output is missing a valid sitemap.");
  for (const article of articles) {
    const html = await readFile(routeToArtifactPath(root, article.slug), "utf8").catch(() => "");
    const expectedCanonical = `${PRODUCTION_SITE_ORIGIN}/bai-viet/${article.slug}/`;
    if (!html.includes(escapeHTML(article.title)) || !html.includes(`rel="canonical" href="${expectedCanonical}"`) || hasNoIndexRobotsMeta(html)) {
      throw new Error(`Production output is missing published article ${article.slug}, its current title, self canonical, or indexable robots metadata.`);
    }
  }
  if (!trigger.articleSlug) return;
  const route = `/bai-viet/${encodeURIComponent(trigger.articleSlug)}/`;
  const isPublished = articles.some(({ slug }) => slug === trigger.articleSlug);
  const inSitemap = sitemap.includes(`${PRODUCTION_SITE_ORIGIN}${route}`);
  if (trigger.triggerReason === "unpublish") {
    if (isPublished || inSitemap || await fileExists(path.join(root, "out", route.slice(1), "index.html"))) {
      throw new Error("Unpublished article remains in the production API snapshot, static route, or sitemap.");
    }
  } else if (!isPublished || !inSitemap || !await fileExists(routeToArtifactPath(root, trigger.articleSlug))) {
    throw new Error("The published production article is missing from the Payload snapshot, static route, or sitemap.");
  }
}

async function verifyProduction(context: ProductionBuildEnvironment, state: ProductionBuildState) {
  const robots = await fetch(`${context.siteOrigin}/robots.txt?build-check=${context.buildId}`, { cache: "no-store" });
  const robotsText = await robots.text();
  if (!robots.ok || /^Disallow:\s*\/\s*$/imu.test(robotsText)) throw new Error("Production robots.txt blocks crawling after deployment.");
  const sitemap = await fetch(`${context.siteOrigin}/sitemap.xml?build-check=${context.buildId}`, { cache: "no-store" });
  if (!sitemap.ok) throw new Error(`Production sitemap returned HTTP ${sitemap.status} after deployment.`);
  const sitemapText = await sitemap.text();

  if (state.trigger.triggerReason === "unpublish" && state.trigger.articleSlug) {
    const removed = await retryUntilProductionRouteRemoved(async (attempt) => {
      const url = new URL(`/bai-viet/${encodeURIComponent(state.trigger.articleSlug!)}/`, context.siteOrigin);
      url.searchParams.set("build-check", context.buildId);
      url.searchParams.set("deploy-probe", `${attempt}-${Date.now()}`);
      const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(10_000) });
      return response.status;
    });
    if (!removed || sitemapText.includes(`${context.siteOrigin}/bai-viet/${state.trigger.articleSlug}/`)) {
      throw new Error("The unpublished production article remains available on the public edge or in the sitemap.");
    }
    return;
  }

  for (const article of state.articles) {
    const route = `${context.siteOrigin}/bai-viet/${encodeURIComponent(article.slug)}/`;
    const current = await retryUntilProductionCondition(async (attempt) => {
      const url = new URL(route);
      url.searchParams.set("build-check", context.buildId);
      url.searchParams.set("deploy-probe", `${attempt}-${Date.now()}`);
      const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(10_000) });
      if (!response.ok || hasNoIndex(response.headers.get("x-robots-tag"))) return false;
      const html = await response.text();
      return html.includes(escapeHTML(article.title))
        && html.includes(`rel="canonical" href="${context.siteOrigin}/bai-viet/${article.slug}/"`)
        && !hasNoIndexRobotsMeta(html)
        && html.includes("index, follow");
    });
    if (!current) throw new Error(`Production did not serve the current published article, canonical, and indexable robots state for ${article.slug}.`);
  }
  if (state.trigger.articleSlug && !sitemapText.includes(`${context.siteOrigin}/bai-viet/${state.trigger.articleSlug}/`)) {
    throw new Error("The published article is missing from the production sitemap after deployment.");
  }
}

export async function retryUntilProductionCondition(
  probe: (attempt: number) => Promise<boolean>,
  options: { attempts?: number; wait?: (delayMs: number) => Promise<void> } = {},
) {
  const attempts = Math.max(1, Math.floor(options.attempts ?? MAX_EDGE_PROBE_ATTEMPTS));
  const wait = options.wait ?? ((delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { if (await probe(attempt)) return true; } catch { /* Retry transient edge failures within the bound. */ }
    if (attempt < attempts) await wait(Math.min(attempt * 1500, 5000));
  }
  return false;
}

async function fetchPublishedArticles(origin: string): Promise<Article[]> {
  const articles: Article[] = [];
  for (let page = 1; page <= MAX_ARTICLES; page += 1) {
    const response = await fetch(`${origin}/api/articles?limit=100&page=${page}&depth=1&sort=slug`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Production Payload article API returned HTTP ${response.status}.`);
    const result = await response.json() as { docs?: Record<string, unknown>[]; hasNextPage?: boolean };
    if (!Array.isArray(result.docs)) throw new Error("Production Payload returned an invalid article list.");
    for (const doc of result.docs) {
      if (doc._status !== "published") throw new Error("The unauthenticated production article API exposed a non-published article.");
      if (typeof doc.slug !== "string" || !doc.slug || typeof doc.title !== "string" || !doc.title) throw new Error("A published production article is missing its slug or title.");
      articles.push(doc as Article);
    }
    if (!result.hasNextPage) return articles;
  }
  throw new Error("Production Payload article pagination exceeded the safety limit.");
}

function publicArticleDigest(articles: Article[]) {
  const normalized = articles.map((article) => stripBuildMetadata(article)).sort((a, b) => a.slug.localeCompare(b.slug));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

async function fetchBuildContext(context: ProductionBuildEnvironment): Promise<BuildContext | undefined> {
  const response = await fetch(`${context.cmsOrigin}/api/site-build/context?buildId=${encodeURIComponent(context.buildId)}`, {
    headers: { Authorization: `Bearer ${context.callbackSecret}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return undefined;
  if (response.status !== 200 && response.status !== 202) throw new Error(`Production CMS build context returned HTTP ${response.status}.`);
  const value = await response.json() as BuildContext;
  if (value.branch !== context.branch || !isUUID(value.requestId)) throw new Error("Production CMS build record does not match the authorized release branch or request.");
  return value;
}

async function waitForBuildContext(context: ProductionBuildEnvironment) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = await fetchBuildContext(context);
    if (value?.ready) return value;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("Production Payload did not create a status record for the Workers Build.");
}

async function postBuildEvent(
  context: ProductionBuildEnvironment,
  status: "building" | "deploying" | "live" | "failed",
  errorCode?: string,
  requestId?: string,
) {
  const body = JSON.stringify({
    buildId: context.buildId,
    branch: context.branch,
    commitSha: context.commitSha,
    status,
    ...(requestId ? { requestId } : {}),
    ...(errorCode ? { errorCode } : {}),
  });
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${context.cmsOrigin}/api/site-build/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${context.callbackSecret}`, "Content-Type": "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      if (status === "live" && response.status === 409) return false;
      if (response.status < 500 && response.status !== 429) throw new Error(`Production CMS rejected build status (${response.status}).`);
      lastError = new Error(`Production CMS rejected build status (${response.status}).`);
    } catch (error) { lastError = error; }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("Could not report production build status to Payload CMS.");
}

export function productionBuildEnvironment(
  env: Record<string, string | undefined>,
  context: ProductionBuildEnvironment,
  trigger?: BuildContext,
) {
  const child = {
    ...process.env,
    ...env,
    STATIC_BUILD_TARGET: "production",
    WORKERS_CI: "1",
    WORKERS_CI_BRANCH: context.branch,
    WORKERS_CI_BUILD_UUID: context.buildId,
    WORKERS_CI_COMMIT_SHA: context.commitSha,
    PAYLOAD_CMS_URL: context.cmsOrigin,
    NEXT_PUBLIC_SITE_ORIGIN: context.siteOrigin,
    SEO_SITE_URL: context.siteOrigin,
    BLOG_CONTENT_PROVIDER: "payload",
    SITE_BUILD_BRANCH: context.branch,
    SITE_BUILD_CALLBACK_SECRET: context.callbackSecret,
    ...(trigger ? { PAYLOAD_BUILD_CACHE_KEY: trigger.requestId } : {}),
  } as NodeJS.ProcessEnv;
  for (const key of [
    "SITE_BUILD_CALLBACK_SECRET",
    "PAYLOAD_ARTICLES_URL",
    "NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL",
    "PAYLOAD_PREVIEW_CACHE_KEY",
    "CF_PAGES_BRANCH",
    "CLOUDFLARE_PREVIEW",
  ]) delete child[key];
  return child;
}

function assertStateMatchesBuild(state: ProductionBuildState, context: ProductionBuildEnvironment) {
  if (state.buildId !== context.buildId || state.branch !== context.branch || state.commitSha !== context.commitSha) {
    throw new Error("Production deployment metadata does not match the current Workers Build.");
  }
}

async function readState(statePath: string): Promise<ProductionBuildState> {
  return JSON.parse(await readFile(statePath, "utf8")) as ProductionBuildState;
}

function currentActiveDeploymentVersion(value: string) {
  const arrayStart = value.indexOf("[");
  const objectStart = value.indexOf("{");
  const offset = arrayStart < 0 ? objectStart : objectStart < 0 ? arrayStart : Math.min(arrayStart, objectStart);
  if (offset < 0) return undefined;
  let parsed: unknown;
  try { parsed = JSON.parse(value.slice(offset)); } catch { return undefined; }
  const deployments = Array.isArray(parsed)
    ? parsed
    : (parsed as { deployments?: unknown[]; result?: unknown[] }).deployments ?? (parsed as { result?: unknown[] }).result;
  return Array.isArray(deployments) ? activeProductionVersionFromDeploymentList(deployments) : undefined;
}

export function activeProductionVersionFromDeploymentList(deployments: unknown[]) {
  const explicitlyCurrent = deployments.find((item) => {
    const deployment = item as { is_current?: boolean; deployment_id?: string };
    return deployment.is_current === true || deployment.deployment_id === "current";
  }) as { versions?: Array<{ version_id?: unknown }> } | undefined;
  const explicitVersion = explicitlyCurrent?.versions?.find((version) => typeof version.version_id === "string")?.version_id;
  if (typeof explicitVersion === "string") return explicitVersion;

  const active = deployments.map((item, index) => ({ item: item as {
    created_on?: string;
    versions?: Array<{ version_id?: unknown; percentage?: number }>;
  }, index })).filter(({ item }) => item.versions?.some((version) => version.percentage === 100 && typeof version.version_id === "string"));
  active.sort((left, right) => {
    const leftTime = Date.parse(left.item.created_on || "");
    const rightTime = Date.parse(right.item.created_on || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return rightTime - leftTime;
    return right.index - left.index;
  });
  return active[0]?.item.versions?.find((version) => version.percentage === 100)?.version_id as string | undefined;
}

function routeToArtifactPath(root: string, slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,180}$/iu.test(slug)) throw new Error("Production article slug is unsafe for a static route.");
  return path.join(root, "out", "bai-viet", slug, "index.html");
}

function hasNoIndexRobotsMeta(html: string) {
  return /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/iu.test(html)
    || /<meta\s+content=["'][^"']*noindex["'][^>]*name=["']robots["']/iu.test(html);
}

function hasNoIndex(value: string | null) {
  return Boolean(value && /\bnoindex\b/iu.test(value));
}

function escapeHTML(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function stripBuildMetadata(value: unknown): Article {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value as Article;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, Array.isArray(entry) ? entry.map(stripNestedMetadata) : stripNestedMetadata(entry)])) as Article;
}

function stripNestedMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNestedMetadata);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, stripNestedMetadata(entry)]));
}

async function fileExists(filePath: string) {
  try { await readFile(filePath); return true; } catch { return false; }
}

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args[0]} exited with status ${result.status ?? "unknown"}.`);
}

function capture(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  try {
    return execFileSync(command, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const value = error as { status?: number; stderr?: Buffer | string; message?: string };
    throw new Error(`${command} ${args[0]} failed (${value.status ?? "unknown"}): ${String(value.stderr || value.message || "").slice(-2000)}`);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const root = process.cwd();
  const env = process.env as Record<string, string | undefined>;
  const task = command === "build" ? runProductionBuild(root, env)
    : command === "deploy" ? deployProduction(root, env)
      : Promise.reject(new Error("Usage: tsx scripts/workers-build-production.ts <build|deploy>"));
  void task.catch(async (error) => {
    console.error(errorMessage(error));
    if (command === "build" || command === "deploy") {
      try {
        const context = buildEnvironment(env);
        await postBuildEvent(context, "failed", "production_build_failed");
      } catch { /* The build may fail before its callback secret or context is available. */ }
    }
    process.exitCode = 1;
  });
}
