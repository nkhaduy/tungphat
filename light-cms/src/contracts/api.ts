import type { CollectionName, ContentStatus, UserRole } from "./content";

export type ApiErrorCode =
  | "unauthorized" | "forbidden" | "not_found" | "validation_failed" | "version_conflict"
  | "rate_limited" | "request_rejected" | "payload_too_large" | "method_not_allowed" | "internal_error";

export type ApiError = { ok: false; error: { code: ApiErrorCode; message: string; requestId: string; fields?: Record<string, string> } };
export type ApiSuccess<T> = { ok: true; data: T; requestId: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type SessionUser = { id: string; email: string; name: string; role: UserRole };
export type ContentSummary = { id: string; collection: CollectionName; slug: string; title: string; status: ContentStatus; version: number; updatedAt: string };
