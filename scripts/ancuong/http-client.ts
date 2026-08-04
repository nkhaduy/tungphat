import { createHash } from "node:crypto";
import { crawlerConfig } from "./config";

export class SourceBlockedError extends Error {
  constructor(public readonly url: string, public readonly status: number, message: string) {
    super(message);
    this.name = "SourceBlockedError";
  }
}

export class HttpStatusError extends Error {
  constructor(public readonly url: string, public readonly status: number) {
    super(`An Cuong request failed with HTTP ${status}: ${url}`);
    this.name = "HttpStatusError";
  }
}

export interface FetchTextResult {
  body: string;
  status: number;
  contentType?: string;
  etag?: string;
  lastModified?: string;
  contentHash: string;
}

interface HttpClientOptions {
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export function assertAllowedUrl(input: string): URL {
  const url = new URL(input);
  if (!crawlerConfig.allowedHosts.has(url.hostname)) throw new Error(`URL host is outside An Cuong scope: ${input}`);
  if (crawlerConfig.blockedPathParts.some((part) => url.pathname.toLocaleLowerCase().includes(part))) {
    throw new Error(`URL path is outside catalogue scope: ${input}`);
  }
  return url;
}

function isChallenge(status: number, body: string): boolean {
  if (![403, 429].includes(status)) return false;
  return /captcha|challenge|just a moment|cf-chl|access denied|verify you are human/i.test(body);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayFor(min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRetries = options.maxRetries ?? crawlerConfig.maxRetries;
  const minDelayMs = options.minDelayMs ?? crawlerConfig.minDelayMs;
  const maxDelayMs = options.maxDelayMs ?? crawlerConfig.maxDelayMs;
  const timeoutMs = options.timeoutMs ?? crawlerConfig.timeoutMs;
  const userAgent = options.userAgent ?? crawlerConfig.userAgent;

  async function fetchText(input: string, conditional?: { etag?: string; lastModified?: string }): Promise<FetchTextResult> {
    const url = assertAllowedUrl(input);
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      if (attempt > 0) await wait(delayFor(minDelayMs, maxDelayMs));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            accept: "text/html,application/json,text/plain;q=0.9,*/*;q=0.1",
            "user-agent": userAgent,
            ...(conditional?.etag ? { "if-none-match": conditional.etag } : {}),
            ...(conditional?.lastModified ? { "if-modified-since": conditional.lastModified } : {})
          }
        });
        const body = await response.text();
        if (isChallenge(response.status, body)) throw new SourceBlockedError(url.toString(), response.status, "An Cuong returned an anti-bot challenge; stopping safely");
        if (response.status === 304) {
          return { body: "", status: 304, contentType: response.headers.get("content-type") ?? undefined, etag: response.headers.get("etag") ?? undefined, lastModified: response.headers.get("last-modified") ?? undefined, contentHash: "" };
        }
        if (response.ok) {
          return {
            body,
            status: response.status,
            contentType: response.headers.get("content-type") ?? undefined,
            etag: response.headers.get("etag") ?? undefined,
            lastModified: response.headers.get("last-modified") ?? undefined,
            contentHash: createHash("sha256").update(body).digest("hex")
          };
        }
        if (response.status === 403) throw new SourceBlockedError(url.toString(), response.status, "An Cuong returned HTTP 403; stopping safely");
        if (![408, 425, 429, 500, 502, 503, 504].includes(response.status)) throw new HttpStatusError(url.toString(), response.status);
        if (attempt >= maxRetries) throw new HttpStatusError(url.toString(), response.status);
        const retryAfter = Number(response.headers.get("retry-after"));
        if (Number.isFinite(retryAfter) && retryAfter > 0) await wait(Math.min(retryAfter * 1000, 30_000));
      } catch (error) {
        lastError = error;
        if (error instanceof SourceBlockedError || error instanceof HttpStatusError && ![408, 425, 429, 500, 502, 503, 504].includes(error.status)) throw error;
        if (attempt >= maxRetries) throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new Error("An Cuong request failed");
  }

  return { fetchText };
}
