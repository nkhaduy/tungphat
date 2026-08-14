import type { Review, ReviewBranch, ReviewPayload } from "./google-review-types";

const TP2_GOOGLE_URL = "https://share.google/sv4nkFEznsGsWhRAQ";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function reviewFrom(value: unknown): Review | null {
  const item = record(value);
  if (!item) return null;
  const reviewId = nullableText(item.review_id);
  const reviewerName = nullableText(item.reviewer_display_name);
  const rating = Number(item.rating);
  if (!reviewId || !reviewerName || !Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return {
    review_id: reviewId,
    reviewer_display_name: reviewerName,
    reviewer_photo_url: safePhotoUrl(item.reviewer_photo_url),
    rating,
    comment: nullableText(item.comment),
    create_time: nullableText(item.create_time),
    update_time: nullableText(item.update_time),
    owner_reply: nullableText(item.owner_reply),
  };
}

function branchFrom(value: unknown): ReviewBranch | null {
  const item = record(value);
  if (!item || (item.branchKey !== "tp1" && item.branchKey !== "tp2")) return null;
  const status = item.status === "ready" || item.status === "error" ? item.status : "empty";
  const reviews = Array.isArray(item.reviews) ? item.reviews.flatMap((review) => {
    const parsed = reviewFrom(review);
    return parsed ? [parsed] : [];
  }) : [];
  return {
    branchKey: item.branchKey,
    status: reviews.length ? "ready" : status,
    location: nullableText(item.location) || `Tùng Phát · Chi nhánh ${item.branchKey === "tp1" ? "1" : "2"}`,
    mapsUrl: safeExternalUrl(item.mapsUrl) || (item.branchKey === "tp2" ? TP2_GOOGLE_URL : null),
    count: Math.max(0, Number(item.count) || 0),
    averageRating: Math.min(5, Math.max(0, Number(item.averageRating) || 0)),
    lastSyncedAt: Number.isFinite(Number(item.lastSyncedAt)) ? Number(item.lastSyncedAt) : null,
    reviews,
  };
}

export function parseReviewPayload(value: unknown): ReviewPayload | null {
  const item = record(value);
  if (!item || !Array.isArray(item.branches)) return null;
  const branches = item.branches.flatMap((branch) => {
    const parsed = branchFrom(branch);
    return parsed ? [parsed] : [];
  }).sort((left, right) => left.branchKey.localeCompare(right.branchKey));
  return { status: branches.some((branch) => branch.status === "ready") ? "ready" : "empty", branches };
}

export function sortReviews(reviews: Review[]) {
  return [...reviews].sort((left, right) => {
    const leftLength = left.comment?.trim().length || 0;
    const rightLength = right.comment?.trim().length || 0;
    if (Boolean(leftLength) !== Boolean(rightLength)) return leftLength ? -1 : 1;
    if (leftLength !== rightLength) return rightLength - leftLength;
    const leftTime = Date.parse(left.update_time || left.create_time || "") || 0;
    const rightTime = Date.parse(right.update_time || right.create_time || "") || 0;
    return rightTime - leftTime;
  });
}

export function reviewerInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("vi-VN") || "G";
}

export function safeExternalUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

export const safePhotoUrl = safeExternalUrl;

export function reviewDateLabel(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
