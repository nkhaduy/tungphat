import { json, readJson } from "../auth/http";
import { type VerifiedSession, validMutation, verifySession } from "../auth/session";
import { clearGitHubTokenCache, githubToken } from "./app";

const OWNER = "nkhaduy";
const REPOSITORY = "tungphat";
const BRANCH = "main";
const API_PREFIX = `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;
const MAX_GATEWAY_BODY_BYTES = 8 * 1024 * 1024;
const SAFE_MUTATION_PREFIXES = ["content/", "public/uploads/"];

type GatewayEnv = Pick<CloudflareCmsEnv,
  "DB" | "CMS_SESSION_SECRET" | "CMS_ALLOWED_ORIGINS" |
  "GITHUB_APP_ID" | "GITHUB_INSTALLATION_ID" | "GITHUB_APP_PRIVATE_KEY" | "GITHUB_FINE_GRAINED_TOKEN"
>;

function decodedGatewayPath(request: Request) {
  const pathname = new URL(request.url).pathname;
  const prefix = "/git-gateway/github/";
  if (!pathname.startsWith(prefix)) return null;
  try {
    const value = decodeURIComponent(pathname.slice(prefix.length));
    if (!value || value.length > 2048 || value.includes("%") || value.includes("\\") || value.includes("\0") || value.split("/").includes("..")) return null;
    return value;
  } catch {
    return null;
  }
}

function safeTreeReadPath(path: string) {
  return path === "content" || path === "public/uploads" || safeRepositoryPath(path);
}

export function isAllowedRepositoryRoute(method: string, path: string) {
  if (method === "GET") {
    if (path === `branches/${BRANCH}` || /^git\/blobs\/[0-9a-f]{40}$/i.test(path)
      || path === "commits" || path === "contents/.lfsconfig" || path === "contents/.gitattributes") return true;
    const tree = path.match(/^git\/trees\/(.+)$/i)?.[1];
    if (!tree) return false;
    if (/^[0-9a-f]{40}$/i.test(tree) || tree === BRANCH) return true;
    const prefix = `${BRANCH}:`;
    return tree.startsWith(prefix) && safeTreeReadPath(tree.slice(prefix.length));
  }
  if (method === "POST") return path === "git/blobs" || path === "git/trees" || path === "git/commits";
  if (method === "PATCH") return path === `git/refs/heads/${BRANCH}`;
  return false;
}

export function safeRepositoryPath(path: string) {
  if (!path || path.length > 512 || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  if (!/^[A-Za-z0-9._/-]+$/.test(path)) return false;
  if (path.split("/").some((part) => !part || part === "." || part === "..")) return false;
  return SAFE_MUTATION_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function queryString(request: Request, path: string) {
  const incoming = new URL(request.url).searchParams;
  const output = new URLSearchParams();
  const allow = path === "commits" ? ["path", "sha", "per_page", "page"] : ["recursive"];
  for (const name of allow) {
    const value = incoming.get(name);
    if (value !== null) output.set(name, value.slice(0, 512));
  }
  if (path === "commits" && output.get("sha") && output.get("sha") !== BRANCH) return null;
  if (path === "commits" && output.get("path") && !safeRepositoryPath(output.get("path") || "")) return null;
  const encoded = output.toString();
  return encoded ? `?${encoded}` : "";
}

function validBlob(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  return (value.encoding === "base64" || value.encoding === "utf-8") && typeof value.content === "string";
}

function validTree(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const value = body as { base_tree?: unknown; tree?: unknown };
  if (typeof value.base_tree !== "string" || !/^[0-9a-f]{40}$/i.test(value.base_tree) || !Array.isArray(value.tree) || value.tree.length > 250) return false;
  return value.tree.every((item) => {
    if (!item || typeof item !== "object") return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.path === "string" && safeRepositoryPath(entry.path)
      && entry.mode === "100644" && entry.type === "blob"
      && (entry.sha === null || (typeof entry.sha === "string" && /^[0-9a-f]{40}$/i.test(entry.sha)));
  });
}

function validCommit(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  return typeof value.message === "string" && value.message.length >= 1 && value.message.length <= 500
    && typeof value.tree === "string" && /^[0-9a-f]{40}$/i.test(value.tree)
    && Array.isArray(value.parents) && value.parents.length === 1
    && typeof value.parents[0] === "string" && /^[0-9a-f]{40}$/i.test(value.parents[0]);
}

function validRef(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  return typeof value.sha === "string" && /^[0-9a-f]{40}$/i.test(value.sha) && value.force !== true;
}

function validMutationBody(path: string, body: unknown) {
  if (path === "git/blobs") return validBlob(body);
  if (path === "git/trees") return validTree(body);
  if (path === "git/commits") return validCommit(body);
  if (path === `git/refs/heads/${BRANCH}`) return validRef(body);
  return false;
}

type GitObjectKind = "blob" | "tree" | "commit";

async function rememberObject(env: GatewayEnv, session: VerifiedSession, sha: string, kind: GitObjectKind) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO cms_git_objects(session_hash,object_sha,object_kind,created_at,expires_at)
    VALUES(?1,?2,?3,?4,?5)
    ON CONFLICT(session_hash,object_sha) DO UPDATE SET object_kind=?3,created_at=?4,expires_at=?5
  `).bind(session.sessionHash, sha, kind, now, session.expiresAt).run();
}

async function hasRememberedObject(env: GatewayEnv, session: VerifiedSession, sha: string, kind: GitObjectKind) {
  const row = await env.DB.prepare(`
    SELECT object_sha FROM cms_git_objects
    WHERE session_hash=?1 AND object_sha=?2 AND object_kind=?3 AND expires_at>?4
  `).bind(session.sessionHash, sha, kind, Math.floor(Date.now() / 1000)).first<{ object_sha: string }>();
  return Boolean(row);
}

async function clearRememberedObjects(env: GatewayEnv, session: VerifiedSession) {
  await env.DB.prepare("DELETE FROM cms_git_objects WHERE session_hash=?1").bind(session.sessionHash).run();
}

async function githubRequest(env: GatewayEnv, path: string, init: RequestInit = {}) {
  return fetch(`${API_PREFIX}/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${await githubToken(env)}`,
      "Content-Type": "application/json",
      "User-Agent": "tungphat-cms-gateway",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
}

async function currentBranch(env: GatewayEnv) {
  const response = await githubRequest(env, `branches/${BRANCH}`);
  if (!response.ok) throw new Error(`github_branch_${response.status}`);
  const body = await response.json() as { commit?: { sha?: string; commit?: { tree?: { sha?: string } } } };
  const commitSha = body.commit?.sha;
  const treeSha = body.commit?.commit?.tree?.sha;
  if (!commitSha || !treeSha || !/^[0-9a-f]{40}$/i.test(commitSha) || !/^[0-9a-f]{40}$/i.test(treeSha)) {
    throw new Error("github_branch_invalid");
  }
  return { commitSha, treeSha };
}

async function validateMutationChain(path: string, body: unknown, env: GatewayEnv, session: VerifiedSession) {
  if (path === "git/blobs") return true;
  if (path === "git/trees") {
    const value = body as { base_tree: string; tree: Array<{ sha: string | null }> };
    const branch = await currentBranch(env);
    // Decap passes the current commit SHA as `base_tree`; GitHub resolves it to that commit's tree.
    // Both accepted values are pinned to the live branch head, so historical/arbitrary trees remain blocked.
    if (value.base_tree !== branch.treeSha && value.base_tree !== branch.commitSha) return false;
    for (const entry of value.tree) {
      if (entry.sha && !(await hasRememberedObject(env, session, entry.sha, "blob"))) return false;
    }
    return true;
  }
  if (path === "git/commits") {
    const value = body as { tree: string; parents: string[] };
    const branch = await currentBranch(env);
    return value.parents[0] === branch.commitSha && await hasRememberedObject(env, session, value.tree, "tree");
  }
  if (path === `git/refs/heads/${BRANCH}`) {
    return hasRememberedObject(env, session, (body as { sha: string }).sha, "commit");
  }
  return false;
}

async function rememberMutationResult(path: string, response: Response, env: GatewayEnv, session: VerifiedSession) {
  if (!response.ok) return;
  const body = await response.clone().json().catch(() => null) as { sha?: string; object?: { sha?: string } } | null;
  if (path === "git/blobs" && body?.sha) await rememberObject(env, session, body.sha, "blob");
  else if (path === "git/trees" && body?.sha) await rememberObject(env, session, body.sha, "tree");
  else if (path === "git/commits" && body?.sha) await rememberObject(env, session, body.sha, "commit");
  else if (path === `git/refs/heads/${BRANCH}` && body?.object?.sha) await clearRememberedObjects(env, session);
}

function proxyResponse(response: Response) {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  for (const name of ["ETag", "Link", "Last-Modified", "X-GitHub-Request-Id"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handleGitGateway(request: Request, env: GatewayEnv) {
  const session = await verifySession(request, env);
  if (!session) return json({ message: "Unauthorized" }, 401);
  const path = decodedGatewayPath(request);
  if (!path || !isAllowedRepositoryRoute(request.method, path)) return json({ message: "Not found" }, 404);
  const mutation = request.method !== "GET";
  if (mutation && !(await validMutation(request, env, session))) return json({ message: "Request rejected" }, 403);
  const query = queryString(request, path);
  if (query === null) return json({ message: "Invalid request" }, 400);

  let body: unknown;
  let bodyText: string | undefined;
  if (mutation) {
    body = await readJson<unknown>(request, MAX_GATEWAY_BODY_BYTES);
    if (!validMutationBody(path, body)) return json({ message: "Invalid request" }, 400);
    if (!(await validateMutationChain(path, body, env, session))) return json({ message: "Git state conflict" }, 409);
    bodyText = JSON.stringify(body);
  }

  const makeRequest = async () => githubRequest(env, `${path}${query}`, {
    method: request.method,
    body: bodyText,
  });

  try {
    let response = await makeRequest();
    if (response.status === 401) {
      clearGitHubTokenCache();
      response = await makeRequest();
    }
    if (mutation) await rememberMutationResult(path, response, env, session);
    return proxyResponse(response);
  } catch {
    return json({ message: "Git service unavailable" }, 503);
  }
}

export const FIXED_GITHUB_REPOSITORY = `${OWNER}/${REPOSITORY}`;
export const FIXED_GITHUB_BRANCH = BRANCH;
