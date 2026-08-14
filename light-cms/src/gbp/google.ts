export type GoogleReview = {
  reviewId: string;
  reviewerDisplayName: string;
  reviewerPhotoUrl: string | null;
  rating: number;
  comment: string | null;
  createTime: string | null;
  updateTime: string | null;
  ownerReply: string | null;
  ownerReplyUpdateTime: string | null;
  locationName: string;
};

const API_REVIEWS = "https://mybusiness.googleapis.com/v4";
const API_PERFORMANCE = "https://businessprofileperformance.googleapis.com/v1";

const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function safeJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function jsonError(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function retryGoogleRequest(request: () => Promise<Response>, attempt = 0): Promise<Response> {
  try {
    const response = await request();
    if ([401, 403].includes(response.status)) {
      throw new Error(response.status === 401 ? "google_unauthorized" : "google_forbidden");
    }
    if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt >= 2) return response;
  } catch (error) {
    if (error instanceof Error && ["google_unauthorized", "google_forbidden"].includes(error.message)) throw error;
    if (attempt >= 2) throw error;
  }
  await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** attempt)));
  return retryGoogleRequest(request, attempt + 1);
}

export function normalizeReview(input: Record<string, unknown>, locationName: string): GoogleReview {
  const reviewer = safeJson(input.reviewer);
  const reply = safeJson(input.reviewReply);
  const ratingValue = typeof input.starRating === "number" ? input.starRating : ratingMap[String(input.starRating || "")] || 1;
  return {
    reviewId: String(input.reviewId || input.name || ""),
    reviewerDisplayName: String(reviewer.displayName || "Khách hàng Google"),
    reviewerPhotoUrl: typeof reviewer.profilePhotoUrl === "string" ? reviewer.profilePhotoUrl : null,
    rating: Math.min(5, Math.max(1, ratingValue)),
    comment: typeof input.comment === "string" && input.comment.trim() ? input.comment.trim() : null,
    createTime: typeof input.createTime === "string" ? input.createTime : null,
    updateTime: typeof input.updateTime === "string" ? input.updateTime : null,
    ownerReply: typeof reply.comment === "string" && reply.comment.trim() ? reply.comment.trim() : null,
    ownerReplyUpdateTime: typeof reply.updateTime === "string" ? reply.updateTime : null,
    locationName,
  };
}

async function googleJson(response: Response) {
  const body = safeJson(await response.json().catch(() => ({})));
  if (!response.ok) {
    const code = response.status === 401 ? "google_unauthorized" : response.status === 403 ? "google_forbidden" : response.status === 429 ? "google_quota" : "google_request_failed";
    throw new Error(code);
  }
  return body;
}

export async function fetchAllReviews(token: string, locationName: string, now = Date.now()): Promise<GoogleReview[]> {
  const result: GoogleReview[] = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" });
    if (pageToken) query.set("pageToken", pageToken);
    const response = await retryGoogleRequest(() => fetch(`${API_REVIEWS}/${locationName}/reviews?${query}`, { headers: { Authorization: `Bearer ${token}` } }));
    const body = await googleJson(response);
    for (const review of Array.isArray(body.reviews) ? body.reviews : []) result.push(normalizeReview(safeJson(review), locationName));
    pageToken = typeof body.nextPageToken === "string" ? body.nextPageToken : "";
  } while (pageToken && result.length < 1000);
  void now;
  return result.filter((review) => review.reviewId);
}

const dailyMetrics = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_CONVERSATIONS", "BUSINESS_DIRECTION_REQUESTS", "CALL_CLICKS", "WEBSITE_CLICKS",
  "BUSINESS_BOOKINGS", "BUSINESS_FOOD_ORDERS", "BUSINESS_FOOD_MENU_CLICKS",
] as const;

export type DailyMetric = { date: string; metric: string; value: number };

export async function fetchDailyMetrics(token: string, locationName: string, startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const rows: DailyMetric[] = [];
  for (const metric of dailyMetrics) {
    const query = new URLSearchParams({
      dailyMetric: metric,
      "dailyRange.startDate.year": String(startYear), "dailyRange.startDate.month": String(startMonth), "dailyRange.startDate.day": String(startDay),
      "dailyRange.endDate.year": String(endYear), "dailyRange.endDate.month": String(endMonth), "dailyRange.endDate.day": String(endDay),
    });
    const response = await retryGoogleRequest(() => fetch(`${API_PERFORMANCE}/${locationName}:getDailyMetricsTimeSeries?${query}`, { headers: { Authorization: `Bearer ${token}` } }));
    const body = await googleJson(response);
    const timeSeries = safeJson(body.timeSeries);
    for (const point of Array.isArray(timeSeries.datedValues) ? timeSeries.datedValues : []) {
      const date = safeJson(point.date);
      const value = typeof point.value === "string" || typeof point.value === "number" ? Number(point.value) : 0;
      rows.push({ date: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`, metric, value });
    }
  }
  return rows;
}

export async function fetchMonthlyKeywordImpressions(token: string, locationName: string, startMonth: string, endMonth: string, now = Date.now()) {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  const rows: Array<{ keyword: string; impressions: number | null; threshold: number | null }> = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({
      "monthlyRange.startMonth.year": String(startYear), "monthlyRange.startMonth.month": String(startMonthNumber), "monthlyRange.startMonth.day": "1",
      "monthlyRange.endMonth.year": String(endYear), "monthlyRange.endMonth.month": String(endMonthNumber), "monthlyRange.endMonth.day": "1", pageSize: "100",
    });
    if (pageToken) query.set("pageToken", pageToken);
    const response = await retryGoogleRequest(() => fetch(`${API_PERFORMANCE}/${locationName}/searchkeywords/impressions/monthly?${query}`, { headers: { Authorization: `Bearer ${token}` } }));
    const body = await googleJson(response);
    for (const item of Array.isArray(body.searchKeywordsCounts) ? body.searchKeywordsCounts : []) {
      const insights = safeJson(item.insightsValue);
      rows.push({ keyword: String(item.searchKeyword || ""), impressions: insights.value === undefined ? null : Number(insights.value), threshold: insights.threshold === undefined ? null : Number(insights.threshold) });
    }
    pageToken = typeof body.nextPageToken === "string" ? body.nextPageToken : "";
  } while (pageToken && rows.length < 10_000);
  void now;
  return rows.filter((row) => row.keyword);
}

export { API_PERFORMANCE, API_REVIEWS, jsonError };
