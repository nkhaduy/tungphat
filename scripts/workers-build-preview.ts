import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PREVIEW_BRANCH = "codex/editorial-cms";
export const STAGING_CMS_ORIGIN = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";
export const PREVIEW_ORIGIN = "https://tungphat-static-assets-preview.nkhaduy.workers.dev";
const STATE_DIR = ".workers-build";
const STATE_FILE = "preview-state.json";
const MEDIA_ALLOWLIST = "_preview-media-allowlist.json";
const MAX_ARTICLE_PAGES = 50;

type BuildEnvironment = {
  branch: string;
  buildId: string;
  commitSha: string;
  cmsOrigin: string;
  previewOrigin: string;
  callbackSecret: string;
};

type Article = Record<string, unknown> & { slug: string; title: string; _status: "published" };
type BuildContext = { branch: string; articleSlug: string | null; triggerReason: string | null; requestId: string; updatedAt?: string; ready?: boolean };
type PreviewBuildState = {
  buildId: string;
  branch: string;
  commitSha: string;
  articleDigest: string;
  articles: Array<{ slug: string; title: string }>;
  mediaPaths: string[];
  trigger: BuildContext;
};
const MAX_CONTENT_CONVERGENCE_ATTEMPTS = 3;

export function previewArtifactIsCurrent(input: {
  artifactDigest: string;
  latestDigest: string;
  artifactRequestId: string;
  latestRequestId: string;
}) {
  return input.artifactDigest === input.latestDigest && input.artifactRequestId === input.latestRequestId;
}

export function previewDeploymentArguments(buildId: string) {
  return ["deploy", "--config", "wrangler.static-preview.jsonc", "--message", `CMS publish ${buildId}`];
}

export function validatePreviewBuildEnvironment(env: Record<string, string | undefined>): Omit<BuildEnvironment, "callbackSecret"> {
  if (env.STATIC_BUILD_TARGET !== "preview" || env.WORKERS_CI !== "1") throw new Error("This command is restricted to a Workers Builds preview job.");
  if (env.WORKERS_CI_BRANCH !== PREVIEW_BRANCH) throw new Error(`Preview build branch must be ${PREVIEW_BRANCH}.`);
  const buildId = env.WORKERS_CI_BUILD_UUID || "";
  if (!isUUID(buildId)) throw new Error("Workers Builds did not provide a valid build UUID.");
  const commitSha = resolvePreviewCommitSha(env.WORKERS_CI_COMMIT_SHA, readCheckedOutCommitSha(process.cwd()));
  const cmsOrigin = exactHttpsOrigin(env.PAYLOAD_ARTICLES_URL, STAGING_CMS_ORIGIN, "staging Payload");
  const previewOrigin = exactHttpsOrigin(env.NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL, PREVIEW_ORIGIN, "preview media");
  if (env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) throw new Error("Preview builds must not receive a production analytics measurement ID.");
  return { branch: PREVIEW_BRANCH, buildId, commitSha, cmsOrigin, previewOrigin };
}

export function resolvePreviewCommitSha(workersBuildSha: string | undefined, checkedOutSha: string | undefined) {
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

export function collectPreviewUploadPaths(value: unknown) {
  const paths = new Set<string>();
  const visit = (item: unknown) => {
    if (Array.isArray(item)) { item.forEach(visit); return; }
    if (!item || typeof item !== "object") {
      if (typeof item === "string") addUploadPath(item, paths);
      return;
    }
    Object.values(item as Record<string, unknown>).forEach(visit);
  };
  visit(value);
  return [...paths].sort();
}

export function previewArticleMediaPaths(articles: Article[], articleSlug: string | null) {
  const article = articleSlug ? articles.find((candidate) => candidate.slug === articleSlug) : undefined;
  return article ? collectPreviewUploadPaths([article]) : [];
}

export function routeToArtifactPath(root: string, slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,180}$/iu.test(slug)) throw new Error("Article slug is unsafe for a static route.");
  return path.join(root, "out", "bai-viet", slug, "index.html");
}

export function publicArticleDigest(articles: Article[]) {
  const normalized = articles.map((article) => stripBuildMetadata(article) as Article).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

async function buildPreview(root: string, env: Record<string, string | undefined>) {
  const context = buildEnvironment(env);
  let failureCode: string = "unknown";
  try {
    await postBuildEvent(context, "building");
    const trigger = await waitForBuildContext(context);
    await createStablePreviewArtifact(root, env, context, trigger);
  } catch (error) {
    failureCode = error instanceof BuildFailure ? error.code : errorMessage(error).includes("Payload") ? "payload_unavailable" : "unknown";
    await postBuildEvent(context, "failed", failureCode).catch((callbackError) => console.error("Could not report build failure to CMS:", errorMessage(callbackError)));
    throw error;
  }
}

async function deployPreview(root: string, env: Record<string, string | undefined>) {
  const context = buildEnvironment(env);
  const statePath = path.join(root, STATE_DIR, STATE_FILE);
  let state = JSON.parse(await readFile(statePath, "utf8")) as PreviewBuildState;
  if (state.buildId !== context.buildId || state.branch !== context.branch || state.commitSha !== context.commitSha) {
    throw new Error("Preview deployment metadata does not match the current Workers Build.");
  }

  const wrangler = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
  const config = "wrangler.static-preview.jsonc";
  let previousVersion: string | undefined;
  try {
    previousVersion = currentActiveDeploymentVersion(await capture(wrangler, ["deployments", "list", "--config", config, "--json"], root, childEnvironment(env, context)));
  } catch (error) {
    console.warn("No prior preview version was found for rollback:", errorMessage(error));
  }

  let deployStarted = false;
  try {
    for (let attempt = 0; attempt < MAX_CONTENT_CONVERGENCE_ATTEMPTS; attempt += 1) {
      const latestContext = await fetchBuildContext(context);
      const latestArticles = await fetchPublishedArticles(context.cmsOrigin);
      const latestDigest = publicArticleDigest(latestArticles);
      if (!latestContext || !previewArtifactIsCurrent({
        artifactDigest: state.articleDigest,
        latestDigest,
        artifactRequestId: state.trigger.requestId,
        latestRequestId: latestContext.requestId,
      })) {
        state = await createStablePreviewArtifact(root, env, context, latestContext || state.trigger);
      }

      await postBuildEvent(context, "deploying", undefined, state.trigger.requestId);
      deployStarted = true;
      await run(wrangler, previewDeploymentArguments(context.buildId), root, childEnvironment(env, context));
      await verifyPreview(context, state, env);

      const afterDeployContext = await fetchBuildContext(context);
      const afterDeployDigest = publicArticleDigest(await fetchPublishedArticles(context.cmsOrigin));
      if (!afterDeployContext || !previewArtifactIsCurrent({
        artifactDigest: state.articleDigest,
        latestDigest: afterDeployDigest,
        artifactRequestId: state.trigger.requestId,
        latestRequestId: afterDeployContext.requestId,
      })) {
        if (attempt + 1 === MAX_CONTENT_CONVERGENCE_ATTEMPTS) break;
        state = await createStablePreviewArtifact(root, env, context, afterDeployContext || state.trigger);
        continue;
      }

      const accepted = await postBuildEvent(context, "live", undefined, state.trigger.requestId);
      if (accepted) return;
      if (attempt + 1 === MAX_CONTENT_CONVERGENCE_ATTEMPTS) break;
      const refreshed = await fetchBuildContext(context);
      state = await createStablePreviewArtifact(root, env, context, refreshed || state.trigger);
    }
    throw new BuildFailure("artifact_validation", "Staging content changed repeatedly while the preview deployment was being verified.");
  } catch (error) {
    if (deployStarted && previousVersion) {
      try {
        await run(wrangler, ["rollback", previousVersion, "--config", config, "--message", "Automatic rollback after preview smoke check failure", "--yes"], root, childEnvironment(env, context));
      } catch (rollbackError) {
        console.error("Automatic preview rollback failed:", errorMessage(rollbackError));
      }
    }
    const code = error instanceof BuildFailure ? error.code : "preview_probe_failed";
    await postBuildEvent(context, "failed", code).catch((callbackError) => console.error("Could not report deploy failure to CMS:", errorMessage(callbackError)));
    throw error;
  }
}

async function createStablePreviewArtifact(root: string, env: Record<string, string | undefined>, context: BuildEnvironment, initialContext: BuildContext): Promise<PreviewBuildState> {
  let trigger = initialContext;
  for (let attempt = 0; attempt < MAX_CONTENT_CONVERGENCE_ATTEMPTS; attempt += 1) {
    trigger = await fetchBuildContext(context) || trigger;
    if (trigger.branch !== context.branch) throw new BuildFailure("unknown", "CMS build record is for a different branch.");
    const before = await fetchPublishedArticles(context.cmsOrigin);
    const beforeDigest = publicArticleDigest(before);
    await run("npm", ["run", "build"], root, previewBuildEnvironment(env, context, trigger));
    const after = await fetchPublishedArticles(context.cmsOrigin);
    const afterDigest = publicArticleDigest(after);
    const latestContext = await fetchBuildContext(context);

    if (!latestContext || !previewArtifactIsCurrent({
      artifactDigest: beforeDigest,
      latestDigest: afterDigest,
      artifactRequestId: trigger.requestId,
      latestRequestId: latestContext.requestId,
    })) {
      trigger = latestContext || trigger;
      continue;
    }

    await validateStaticPreviewOutput(root, after, latestContext);
    const state: PreviewBuildState = {
      buildId: context.buildId,
      branch: context.branch,
      commitSha: context.commitSha,
      articleDigest: afterDigest,
      articles: after.map(({ slug, title }) => ({ slug, title })),
      mediaPaths: previewArticleMediaPaths(after, latestContext.articleSlug),
      trigger: latestContext,
    };
    await writeFile(path.join(root, "out", MEDIA_ALLOWLIST), JSON.stringify(collectPreviewUploadPaths(after)), { mode: 0o644 });
    await mkdir(path.join(root, STATE_DIR), { recursive: true });
    await writeFile(path.join(root, STATE_DIR, STATE_FILE), JSON.stringify(state), { mode: 0o600 });
    return state;
  }
  throw new BuildFailure("artifact_validation", "Staging content changed repeatedly while the static artifact was being built.");
}

async function validateStaticPreviewOutput(root: string, articles: Article[], trigger: BuildContext) {
  for (const article of articles) {
    const html = await readFile(routeToArtifactPath(root, article.slug), "utf8").catch(() => "");
    if (!html || !html.includes(escapeHTML(article.title)) || !html.includes("rel=\"canonical\"")) {
      throw new BuildFailure("artifact_validation", `Static output is missing published article ${article.slug} or its metadata.`);
    }
  }
  if (!trigger.articleSlug) return;
  const isPublished = articles.some((article) => article.slug === trigger.articleSlug);
  if (trigger.triggerReason === "unpublish" && isPublished) throw new BuildFailure("artifact_validation", "Unpublished article is still returned by the public staging API.");
  if (trigger.triggerReason !== "unpublish" && !isPublished) throw new BuildFailure("artifact_validation", "The published article is missing from the current staging API response.");
  if (trigger.triggerReason === "unpublish" && await fileExists(path.join(root, "out", "bai-viet", trigger.articleSlug, "index.html"))) {
    throw new BuildFailure("artifact_validation", "Unpublished article remains in the static export.");
  }
}

async function verifyPreview(context: BuildEnvironment, state: { articles: Array<{ slug: string; title: string }>; mediaPaths: string[]; trigger: BuildContext }, env: Record<string, string | undefined>) {
  const previewOrigin = context.previewOrigin;
  const robots = await fetch(`${previewOrigin}/robots.txt?build-check=${context.buildId}`, { cache: "no-store" });
  if (!robots.ok || !(await robots.text()).includes("Disallow: /")) throw new BuildFailure("preview_probe_failed", "Preview robots.txt does not block crawlers.");
  const sitemap = await fetch(`${previewOrigin}/sitemap.xml?build-check=${context.buildId}`, { cache: "no-store" });
  if (sitemap.status !== 404) throw new BuildFailure("preview_probe_failed", "Preview unexpectedly serves an indexable sitemap.");

  for (const article of state.articles) {
    const response = await fetch(`${previewOrigin}/bai-viet/${encodeURIComponent(article.slug)}/?build-check=${context.buildId}`, { cache: "no-store" });
    if (!response.ok) throw new BuildFailure("preview_probe_failed", `Preview does not serve published article ${article.slug}.`);
    const html = await response.text();
    if (!html.includes(escapeHTML(article.title)) || !html.includes("rel=\"canonical\"") || !hasNoIndex(response.headers.get("x-robots-tag"))) {
      throw new BuildFailure("preview_probe_failed", `Preview content, canonical metadata, or noindex header failed for ${article.slug}.`);
    }
    if (html.includes("googletagmanager.com/gtag/js")) throw new BuildFailure("preview_probe_failed", "Google Analytics script appeared in the preview artifact.");
  }
  for (const mediaPath of state.mediaPaths) {
    const response = await fetch(`${previewOrigin}${mediaPath}?build-check=${context.buildId}`, { method: "HEAD", cache: "no-store" });
    if (!response.ok) throw new BuildFailure("preview_probe_failed", `Preview does not serve referenced staging media ${mediaPath}.`);
  }
  if (state.trigger.triggerReason === "unpublish" && state.trigger.articleSlug) {
    const response = await fetch(`${previewOrigin}/bai-viet/${encodeURIComponent(state.trigger.articleSlug)}/?build-check=${context.buildId}`, { cache: "no-store" });
    if (response.status !== 404 && response.status !== 410) throw new BuildFailure("preview_probe_failed", "Unpublished article is still available on preview.");
  }
  if (env.PAYLOAD_ARTICLES_URL !== STAGING_CMS_ORIGIN) throw new Error("Article source changed after build validation.");
}

async function fetchPublishedArticles(origin: string): Promise<Article[]> {
  const articles: Article[] = [];
  for (let page = 1; page <= MAX_ARTICLE_PAGES; page += 1) {
    let response: Response;
    try { response = await fetch(`${origin}/api/articles?limit=100&page=${page}&depth=1&sort=slug`, { cache: "no-store", signal: AbortSignal.timeout(20_000) }); }
    catch (error) { throw new BuildFailure("payload_unavailable", `Payload staging is unavailable: ${errorMessage(error)}`); }
    if (!response.ok) throw new BuildFailure("payload_unavailable", `Payload staging articles returned HTTP ${response.status}.`);
    const result = await response.json() as { docs?: Record<string, unknown>[]; hasNextPage?: boolean };
    if (!Array.isArray(result.docs)) throw new BuildFailure("payload_unavailable", "Payload staging returned an invalid article list.");
    for (const doc of result.docs) {
      if (doc._status !== "published") throw new BuildFailure("artifact_validation", "The unauthenticated staging article API exposed a non-published article.");
      if (typeof doc.slug !== "string" || typeof doc.title !== "string" || !doc.slug || !doc.title) throw new BuildFailure("artifact_validation", "A published Payload article is missing its slug or title.");
      articles.push(doc as Article);
    }
    if (!result.hasNextPage) return articles;
  }
  throw new BuildFailure("payload_unavailable", "Payload staging article pagination exceeded the safety limit.");
}

function buildEnvironment(env: Record<string, string | undefined>): BuildEnvironment {
  const verified = validatePreviewBuildEnvironment(env);
  const callbackSecret = env.SITE_BUILD_CALLBACK_SECRET || "";
  if (callbackSecret.length < 48) throw new Error("Workers Builds is missing the private CMS status callback secret.");
  return { ...verified, callbackSecret };
}

function childEnvironment(env: Record<string, string | undefined>, context: BuildEnvironment) {
  return {
    ...process.env,
    ...env,
    STATIC_BUILD_TARGET: "preview",
    WORKERS_CI: "1",
    WORKERS_CI_BRANCH: context.branch,
    WORKERS_CI_BUILD_UUID: context.buildId,
    WORKERS_CI_COMMIT_SHA: context.commitSha,
    PAYLOAD_ARTICLES_URL: context.cmsOrigin,
    NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL: context.previewOrigin,
    NEXT_PUBLIC_STATIC_BUILD_TARGET: "preview",
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
    SITE_BUILD_CALLBACK_SECRET: context.callbackSecret,
  } as NodeJS.ProcessEnv;
}

export function previewBuildEnvironment(env: Record<string, string | undefined>, context: BuildEnvironment, trigger: Pick<BuildContext, "requestId">) {
  if (!isUUID(trigger.requestId)) throw new Error("Preview build requires a valid CMS publish request ID.");
  return {
    ...childEnvironment(env, context),
    NEXT_PUBLIC_SITE_ORIGIN: "https://gotungphat.com",
    SEO_SITE_URL: "https://gotungphat.com",
    BLOG_CONTENT_PROVIDER: "payload",
    PAYLOAD_PREVIEW_CACHE_KEY: trigger.requestId,
  };
}

async function postBuildEvent(context: BuildEnvironment, status: "building" | "deploying" | "live" | "failed", errorCode?: string, requestId?: string): Promise<boolean> {
  const url = `${context.cmsOrigin}/api/site-build/events`;
  const body = JSON.stringify({ buildId: context.buildId, branch: context.branch, commitSha: context.commitSha, status, ...(requestId ? { requestId } : {}), ...(errorCode ? { errorCode } : {}) });
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${context.callbackSecret}`, "Content-Type": "application/json" }, body, cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (response.ok) return true;
      if (status === "live" && response.status === 409) return false;
      if (response.status < 500 && response.status !== 429) throw new Error(`CMS rejected build status (${response.status}).`);
      lastError = new Error(`CMS rejected build status (${response.status}).`);
    } catch (error) { lastError = error; }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("Could not report build status to Payload CMS.");
}

async function waitForBuildContext(context: BuildEnvironment): Promise<BuildContext> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = await fetchBuildContext(context);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new BuildFailure("payload_unavailable", "Payload did not create a status record for the Workers Build.");
}

async function fetchBuildContext(context: BuildEnvironment): Promise<BuildContext | undefined> {
  let response: Response;
  try {
    response = await fetch(`${context.cmsOrigin}/api/site-build/context?buildId=${encodeURIComponent(context.buildId)}`, {
      headers: { Authorization: `Bearer ${context.callbackSecret}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new BuildFailure("payload_unavailable", `Payload build context is unavailable: ${errorMessage(error)}`);
  }
  if (response.status === 404) return undefined;
  if (response.status !== 200 && response.status !== 202) throw new BuildFailure("payload_unavailable", `Payload build context returned HTTP ${response.status}.`);
  const value = await response.json() as BuildContext;
  if (value.branch !== context.branch || !isUUID(value.requestId)) throw new BuildFailure("unknown", "Payload build record does not match the authorized preview branch or request.");
  return value;
}

function addUploadPath(value: string, paths: Set<string>) {
  let url: URL;
  try { url = new URL(value, PREVIEW_ORIGIN); } catch { return; }
  const relative = !/^https?:/iu.test(value);
  if (!relative && ![new URL(STAGING_CMS_ORIGIN).hostname, new URL(PREVIEW_ORIGIN).hostname].includes(url.hostname)) return;
  const pathname = url.pathname.replace(/^\/media(?=\/)/u, "");
  if (!/^\/(?:uploads|uploads-thumbnails)\//u.test(pathname)) return;
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return; }
  if (decoded.split("/").some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) return;
  paths.add(pathname);
}

function stripBuildMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripBuildMetadata);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, stripBuildMetadata(entry)]));
}

function exactHttpsOrigin(value: string | undefined, expected: string, label: string) {
  let url: URL;
  try { url = new URL(value || ""); } catch { throw new Error(`Preview builds require a valid isolated ${label} origin.`); }
  if (url.protocol !== "https:" || url.origin !== expected || url.pathname !== "/" || url.username || url.password || url.search || url.hash) {
    throw new Error(`Preview builds may only use the configured isolated ${label} origin.`);
  }
  return url.origin;
}

export function currentActiveDeploymentVersion(value: string) {
  const arrayStart = value.indexOf("[");
  const objectStart = value.indexOf("{");
  const offset = arrayStart < 0 ? objectStart : objectStart < 0 ? arrayStart : Math.min(arrayStart, objectStart);
  if (offset < 0) return undefined;
  let parsed: unknown;
  try { parsed = JSON.parse(value.slice(offset)); } catch { return undefined; }
  const deployments = Array.isArray(parsed)
    ? parsed
    : (parsed as { deployments?: unknown[]; result?: unknown[] }).deployments ?? (parsed as { result?: unknown[] }).result;
  if (!Array.isArray(deployments)) return undefined;
  const active = deployments
    .map((deployment) => deployment as { created_on?: unknown; createdOn?: unknown; versions?: unknown[] })
    .filter((deployment) => Array.isArray(deployment.versions) && deployment.versions.length > 0)
    .sort((left, right) => deploymentTimestamp(right) - deploymentTimestamp(left))[0];
  const versions = active?.versions as Array<{ version_id?: unknown; versionId?: unknown; percentage?: unknown }> | undefined;
  const version = versions?.find((candidate) => candidate.percentage === 100) ?? versions?.[0];
  const id = version?.version_id ?? version?.versionId;
  return typeof id === "string" ? id : undefined;
}

function deploymentTimestamp(deployment: { created_on?: unknown; createdOn?: unknown }) {
  const value = deployment.created_on ?? deployment.createdOn;
  if (typeof value !== "string") return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function readCheckedOutCommitSha(root: string) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function hasNoIndex(value: string | null) { return Boolean(value && /noindex/iu.test(value) && /nofollow/iu.test(value)); }
function escapeHTML(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"); }
function isUUID(value: string) { return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu.test(value); }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }
async function fileExists(file: string) { try { await readFile(file); return true; } catch { return false; } }

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited with status ${code ?? "unknown"}.`)));
  });
}

function capture(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `${path.basename(command)} exited with status ${result.status ?? "unknown"}.`);
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

class BuildFailure extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

async function main() {
  const command = process.argv[2];
  const root = process.cwd();
  if (command === "build") await buildPreview(root, process.env);
  else if (command === "deploy") await deployPreview(root, process.env);
  else throw new Error("Use `tsx scripts/workers-build-preview.ts build` or `deploy`.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
