import { describe, expect, it } from "vitest";
import { AccessAuthorizationError, createAccessCsrf, requireAccessMutation, resolveAccessUser } from "../src/worker/security/access-auth";
import { createSqliteD1 } from "./helpers/sqlite-d1";

const now = "2027-01-15T08:00:00.000Z";
const identity = { subject: "subject-1", email: "admin@example.com", issuedAt: 1_800_000_000, expiresAt: 1_800_003_600 };

function seedUser(db: D1Database, values: { id?: string; email?: string; subject?: string | null; role?: string; status?: string } = {}) {
  const id = values.id || "user-1";
  return db.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,access_subject,failed_attempts,created_at,updated_at)
    VALUES(?1,?2,?3,?3,?4,'!access-only!',?5,?6,?7,0,?8,?8)`)
    .bind(id, values.email || "admin@example.com", "Quản trị Tùng Phát", values.role || "admin", values.status === "disabled" ? 0 : 1, values.status || "active", values.subject ?? null, now).run();
}

async function expectAuthCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(AccessAuthorizationError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("Access identity to D1 authorization", () => {
  it("normalizes email and binds a pre-provisioned user to the first verified subject", async () => {
    const { db, sqlite } = createSqliteD1();
    await seedUser(db, { subject: null });
    const user = await resolveAccessUser(db, { ...identity, email: " ADMIN@EXAMPLE.COM " }, "request-1", { now, auditLogin: true });
    expect(user).toEqual(expect.objectContaining({ id: "user-1", accessSubject: "subject-1", email: "admin@example.com", role: "admin", status: "active" }));
    expect(sqlite.prepare("SELECT access_subject,last_login_at FROM users WHERE id='user-1'").get()).toEqual({ access_subject: "subject-1", last_login_at: now });
    expect(sqlite.prepare("SELECT action FROM audit_logs WHERE record_id='user-1'").get()).toEqual({ action: "auth.login" });
  });

  it("rejects an Access-authenticated identity absent from D1 and audits the denied login", async () => {
    const { db, sqlite } = createSqliteD1();
    await expectAuthCode(resolveAccessUser(db, identity, "request-2", { now, auditLogin: true }), "unknown_user");
    const audit = sqlite.prepare("SELECT action,metadata_json FROM audit_logs WHERE action='auth.login.denied'").get() as { action: string; metadata_json: string };
    expect(audit.action).toBe("auth.login.denied");
    expect(JSON.parse(audit.metadata_json)).toEqual({ reason: "unknown_user" });
  });

  it("rejects a disabled user and rechecks status on every request", async () => {
    const { db } = createSqliteD1();
    await seedUser(db, { subject: identity.subject });
    await expect(resolveAccessUser(db, identity, "request-3", { now, auditLogin: false })).resolves.toMatchObject({ id: "user-1" });
    await db.prepare("UPDATE users SET status='disabled',active=0 WHERE id='user-1'").run();
    await expectAuthCode(resolveAccessUser(db, identity, "request-4", { now, auditLogin: false }), "disabled_user");
  });

  it("rejects a subject match when the verified email differs", async () => {
    const { db } = createSqliteD1();
    await seedUser(db, { subject: identity.subject, email: "other@example.com" });
    await expectAuthCode(resolveAccessUser(db, identity, "request-5", { now, auditLogin: true }), "email_mismatch");
  });

  it("rejects an email match already bound to another subject", async () => {
    const { db } = createSqliteD1();
    await seedUser(db, { subject: "different-subject" });
    await expectAuthCode(resolveAccessUser(db, identity, "request-6", { now, auditLogin: true }), "subject_mismatch");
  });

  it("rejects a subject collision that resolves subject and email to different rows", async () => {
    const { db } = createSqliteD1();
    await seedUser(db, { id: "subject-row", subject: identity.subject, email: "subject@example.com" });
    await seedUser(db, { id: "email-row", subject: null, email: identity.email });
    await expectAuthCode(resolveAccessUser(db, identity, "request-7", { now, auditLogin: true }), "subject_collision");
  });

  it("does not create a user or super-admin during first login", async () => {
    const { db, sqlite } = createSqliteD1();
    await expectAuthCode(resolveAccessUser(db, identity, "request-8", { now, auditLogin: false }), "unknown_user");
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
  });

  it("derives a stable per-token CSRF value without creating a D1 session", async () => {
    const token = "header.payload.signature";
    const first = await createAccessCsrf(token, "a".repeat(32));
    const second = await createAccessCsrf(token, "a".repeat(32));
    expect(first).toBe(second);
    expect(first).not.toContain(token);
  });

  it("requires exact staging Origin and the derived CSRF token for mutations", async () => {
    const token = "header.payload.signature";
    const csrf = await createAccessCsrf(token, "a".repeat(32));
    const valid = new Request("https://staging.example/api/products/1", { method: "PATCH", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf } });
    const forgedOrigin = new Request(valid.url, { method: "PATCH", headers: { Origin: "https://evil.example", "X-CSRF-Token": csrf } });
    const forgedCsrf = new Request(valid.url, { method: "PATCH", headers: { Origin: "https://staging.example", "X-CSRF-Token": "forged" } });
    await expect(requireAccessMutation(valid, ["https://staging.example"], token, "a".repeat(32))).resolves.toBe(true);
    await expect(requireAccessMutation(forgedOrigin, ["https://staging.example"], token, "a".repeat(32))).resolves.toBe(false);
    await expect(requireAccessMutation(forgedCsrf, ["https://staging.example"], token, "a".repeat(32))).resolves.toBe(false);
  });
});
