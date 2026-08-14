import type { GoogleReview } from "./google";

export const GBP_RETENTION_SECONDS = 30 * 86_400;

export function reviewRetentionCutoff(nowMs = Date.now()) {
  return Math.floor(nowMs / 1000) - GBP_RETENTION_SECONDS;
}

export function reviewUpsertStatements(db: D1Database, locationName: string, reviews: GoogleReview[], now: number) {
  const expires = now + GBP_RETENTION_SECONDS;
  const statements = reviews.map((review) => db.prepare(`
    INSERT INTO gbp_reviews(review_id,location_name,reviewer_display_name,reviewer_photo_url,rating,comment,create_time,update_time,owner_reply,owner_reply_update_time,available,fetched_at,expires_at,updated_at)
    VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,1,?11,?12,?11)
    ON CONFLICT(review_id) DO UPDATE SET location_name=?2,reviewer_display_name=?3,reviewer_photo_url=?4,rating=?5,comment=?6,create_time=?7,update_time=?8,owner_reply=?9,owner_reply_update_time=?10,available=1,fetched_at=?11,expires_at=?12,updated_at=?11
  `).bind(review.reviewId, locationName, review.reviewerDisplayName, review.reviewerPhotoUrl, review.rating, review.comment, review.createTime, review.updateTime, review.ownerReply, review.ownerReplyUpdateTime, now, expires));
  statements.push(db.prepare("UPDATE gbp_reviews SET available=0,updated_at=?1 WHERE location_name=?2 AND fetched_at<?1").bind(now, locationName));
  statements.push(db.prepare("DELETE FROM gbp_reviews WHERE expires_at<?1").bind(now));
  return statements;
}

export function publicReviewQuery(db: D1Database, locationName: string, now: number, limit = 8) {
  return db.prepare(`SELECT review_id,reviewer_display_name,reviewer_photo_url,rating,comment,create_time,update_time,owner_reply FROM gbp_reviews WHERE location_name=?1 AND available=1 AND expires_at>?2 ORDER BY CASE WHEN TRIM(COALESCE(comment,'')) = '' THEN 1 ELSE 0 END, LENGTH(TRIM(COALESCE(comment,''))) DESC, COALESCE(update_time,create_time) DESC LIMIT ?3`).bind(locationName, now, Math.max(1, Math.min(20, limit)));
}

export function cleanupStatements(db: D1Database, now: number) {
  return [db.prepare("DELETE FROM gbp_reviews WHERE expires_at<?1").bind(now), db.prepare("DELETE FROM gbp_performance_daily WHERE expires_at<?1").bind(now), db.prepare("DELETE FROM gbp_search_keywords_monthly WHERE expires_at<?1").bind(now)];
}
