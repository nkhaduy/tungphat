const leadEvents = new Set(["click_phone", "click_zalo", "click_email", "click_quote", "form_submit"]);

export function countLeadSessions(events: Array<{ event_name: string; session_id: string }>) {
  return new Set(events.filter((event) => leadEvents.has(event.event_name)).map((event) => event.session_id)).size;
}

export function conversionRate(leadSessions: number, totalSessions: number) {
  return totalSessions > 0 ? leadSessions / totalSessions : 0;
}

export function isAssistedConversion(contentViewedAt: number, contactAt: number) {
  return Number.isFinite(contentViewedAt) && Number.isFinite(contactAt) && contentViewedAt < contactAt;
}

export function vietnamDayBounds(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = Math.floor(Date.parse(`${date}T00:00:00+07:00`) / 1000);
  if (!Number.isFinite(start)) return null;
  return { start, end: start + 86400, timezone: "Asia/Ho_Chi_Minh" as const };
}

export function recordMilestone(seen: Set<number>, milestone: 25 | 50 | 75 | 90) {
  if (seen.has(milestone)) return false;
  seen.add(milestone);
  return true;
}
