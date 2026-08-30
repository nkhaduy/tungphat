export type Review = {
  review_id: string;
  reviewer_display_name: string;
  reviewer_photo_url: string | null;
  reviewer_uri?: string | null;
  rating: number;
  comment: string | null;
  create_time: string | null;
  update_time: string | null;
  owner_reply: string | null;
  source?: "google-places-api";
};

export type ReviewBranch = {
  branchKey: "tp1" | "tp2";
  status: "ready" | "empty" | "error";
  location: string;
  mapsUrl: string | null;
  count: number;
  averageRating: number;
  lastSyncedAt: number | null;
  errorCode?: "missing_configuration" | "google_bad_request" | "google_unauthorized" | "google_forbidden" | "google_rate_limited" | "google_request_failed";
  reviews: Review[];
};

export type ReviewPayload = {
  status: "ready" | "empty";
  branches: ReviewBranch[];
};
