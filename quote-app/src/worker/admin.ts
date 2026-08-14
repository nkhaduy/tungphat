import type { Context } from "hono";
import { officialBranch } from "../shared/branches";
import { groupPaymentQueue } from "../shared/payment";
import { mapQuote, quoteSelect, type QuoteRow } from "./quotes";
import { writeAudit } from "./audit";
import type { AppBindings } from "./auth";
import { HttpError, isoNow, requiredParam } from "./http";
import { hashPassword } from "./password";
import { decryptPassword, encryptPassword } from "./password-vault";
import { branchInputSchema, userInputSchema } from "./schemas";

async function assertEmployeeBranch(c: Context<AppBindings>, role: "ADMIN" | "EMPLOYEE", branchId: string | null): Promise<void> {
  if (role !== "EMPLOYEE") return;
  if (!branchId) throw new HttpError(422, "Nhân viên phải thuộc một chi nhánh.");
  const branch = await c.env.DB.prepare("SELECT id FROM branches WHERE id=?1 AND is_active=1 AND deleted_at IS NULL").bind(branchId).first();
  if (!branch) throw new HttpError(422, "Chi nhánh không hợp lệ hoặc đã bị khóa.");
}

export async function dashboardHandler(c: Context<AppBindings>): Promise<Response> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const metrics = await c.env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN quote_date=?1 THEN 1 END) AS quotes_today,
      COALESCE(SUM(CASE WHEN quote_date=?1 AND status!='CANCELLED' THEN grand_total ELSE 0 END),0) AS value_today,
      COALESCE(SUM(CASE WHEN status!='CANCELLED' THEN deposit_amount ELSE 0 END),0) AS total_deposit,
      COALESCE(SUM(CASE WHEN status!='CANCELLED' THEN remaining_amount ELSE 0 END),0) AS total_remaining,
      COUNT(CASE WHEN status='DRAFT' THEN 1 END) AS drafts,
      COUNT(CASE WHEN status='CANCELLED' THEN 1 END) AS cancelled
    FROM quotes WHERE deleted_at IS NULL
  `).bind(today).first<{
    quotes_today: number; value_today: number; total_deposit: number; total_remaining: number; drafts: number; cancelled: number;
  }>();
  const topEmployee = await c.env.DB.prepare(`
    SELECT u.id,u.full_name,COUNT(q.id) AS quote_count
    FROM users u LEFT JOIN quotes q ON q.created_by=u.id AND q.deleted_at IS NULL AND q.status!='CANCELLED'
    WHERE u.deleted_at IS NULL AND u.role='EMPLOYEE' GROUP BY u.id,u.full_name ORDER BY quote_count DESC,u.full_name LIMIT 1
  `).first<{ id: string; full_name: string; quote_count: number }>();
  return c.json({
    metrics: {
      quotesToday: Number(metrics?.quotes_today ?? 0),
      valueToday: Number(metrics?.value_today ?? 0),
      totalDeposit: Number(metrics?.total_deposit ?? 0),
      totalRemaining: Number(metrics?.total_remaining ?? 0),
      drafts: Number(metrics?.drafts ?? 0),
      cancelled: Number(metrics?.cancelled ?? 0),
      topEmployee: topEmployee ? { id: topEmployee.id, fullName: topEmployee.full_name, quoteCount: topEmployee.quote_count } : null,
    },
  });
}

export async function paymentQueueHandler(c: Context<AppBindings>): Promise<Response> {
  const { results } = await c.env.DB.prepare(`
    ${quoteSelect}
    WHERE q.deleted_at IS NULL AND q.status!='CANCELLED'
    ORDER BY q.updated_at DESC,q.created_at DESC
    LIMIT 200
  `).all<QuoteRow>();
  return c.json({ queue: groupPaymentQueue(results.map((row) => mapQuote(row, []))) });
}

export async function listUsersHandler(c: Context<AppBindings>): Promise<Response> {
  const { results } = await c.env.DB.prepare(`
    SELECT u.id,u.username,u.full_name,u.phone,u.role,u.branch_id,u.is_active,u.must_change_password,
           u.password_ciphertext IS NOT NULL AS has_viewable_password,u.last_login_at,u.created_at,b.name AS branch_name
    FROM users u LEFT JOIN branches b ON b.id=u.branch_id WHERE u.deleted_at IS NULL ORDER BY u.full_name
  `).all<{
    id: string; username: string; full_name: string; phone: string; role: "ADMIN" | "EMPLOYEE"; branch_id: string | null;
    is_active: number; must_change_password: number; has_viewable_password: number; last_login_at: string | null; created_at: string; branch_name: string | null;
  }>();
  return c.json({ users: results.map((row) => ({
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    branchId: row.branch_id,
    branchName: row.branch_name,
    isActive: row.is_active === 1,
    mustChangePassword: row.must_change_password === 1,
    hasViewablePassword: row.has_viewable_password === 1,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  })) });
}

export async function createUserHandler(c: Context<AppBindings>): Promise<Response> {
  const parsed = userInputSchema.safeParse(await c.req.json());
  if (!parsed.success || !parsed.data.password) throw new HttpError(422, parsed.error?.issues[0]?.message ?? "Mật khẩu là bắt buộc.");
  await assertEmployeeBranch(c, parsed.data.role, parsed.data.branchId);
  const id = crypto.randomUUID();
  const now = isoNow();
  const [passwordHash, passwordCiphertext] = await Promise.all([
    hashPassword(parsed.data.password),
    encryptPassword(parsed.data.password, c.env.SESSION_SECRET),
  ]);
  const mustChangePassword = parsed.data.role === "EMPLOYEE" ? 1 : 0;
  try {
    await c.env.DB.prepare(`
      INSERT INTO users(id,username,password_hash,password_ciphertext,must_change_password,full_name,phone,role,branch_id,is_active,created_at,updated_at)
      VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11)
    `).bind(
      id, parsed.data.username, passwordHash, passwordCiphertext, mustChangePassword, parsed.data.fullName, parsed.data.phone, parsed.data.role,
      parsed.data.branchId, parsed.data.isActive ? 1 : 0, now,
    ).run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) throw new HttpError(409, "Tên đăng nhập đã tồn tại.");
    throw error;
  }
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: id,
    newData: { ...parsed.data, password: undefined },
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true, id }, 201);
}

export async function updateUserHandler(c: Context<AppBindings>): Promise<Response> {
  const id = requiredParam(c, "id");
  const previous = await c.env.DB.prepare("SELECT id,username,full_name,phone,role,branch_id,is_active FROM users WHERE id=?1 AND deleted_at IS NULL")
    .bind(id).first<{ id: string; username: string; full_name: string; phone: string; role: string; branch_id: string | null; is_active: number }>();
  if (!previous) throw new HttpError(404, "Không tìm thấy tài khoản.");
  const parsed = userInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu tài khoản không hợp lệ.");
  await assertEmployeeBranch(c, parsed.data.role, parsed.data.branchId);
  if (id === c.get("user").id && !parsed.data.isActive) throw new HttpError(409, "Bạn không thể tự khóa tài khoản đang đăng nhập.");
  const now = isoNow();
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`UPDATE users SET username=?1,full_name=?2,phone=?3,role=?4,branch_id=?5,is_active=?6,
      must_change_password=CASE WHEN ?4='ADMIN' THEN 0 ELSE must_change_password END,updated_at=?7 WHERE id=?8`)
      .bind(parsed.data.username, parsed.data.fullName, parsed.data.phone, parsed.data.role, parsed.data.branchId, parsed.data.isActive ? 1 : 0, now, id),
  ];
  if (parsed.data.password) {
    const [passwordHash, passwordCiphertext] = await Promise.all([
      hashPassword(parsed.data.password),
      encryptPassword(parsed.data.password, c.env.SESSION_SECRET),
    ]);
    statements.push(c.env.DB.prepare("UPDATE users SET password_hash=?1,password_ciphertext=?2,must_change_password=?3,updated_at=?4 WHERE id=?5")
      .bind(passwordHash, passwordCiphertext, parsed.data.role === "EMPLOYEE" ? 1 : 0, now, id));
  }
  if (!parsed.data.isActive || parsed.data.password) statements.push(c.env.DB.prepare("DELETE FROM sessions WHERE user_id=?1").bind(id));
  try {
    await c.env.DB.batch(statements);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) throw new HttpError(409, "Tên đăng nhập đã tồn tại.");
    throw error;
  }
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: id,
    oldData: previous,
    newData: { ...parsed.data, password: parsed.data.password ? "[CHANGED]" : undefined },
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true });
}

export async function viewUserPasswordHandler(c: Context<AppBindings>): Promise<Response> {
  const id = requiredParam(c, "id");
  const row = await c.env.DB.prepare("SELECT password_ciphertext FROM users WHERE id=?1 AND role='EMPLOYEE' AND deleted_at IS NULL")
    .bind(id).first<{ password_ciphertext: string | null }>();
  if (!row) throw new HttpError(404, "Không tìm thấy nhân viên.");
  if (!row.password_ciphertext) throw new HttpError(404, "Tài khoản cũ chưa có mật khẩu có thể hiển thị. Hãy đặt lại mật khẩu.");
  const password = await decryptPassword(row.password_ciphertext, c.env.SESSION_SECRET);
  await writeAudit(c.env, { actorUserId: c.get("user").id, action: "USER_PASSWORD_VIEWED", entityType: "USER", entityId: id, requestId: c.get("requestId") });
  return c.json({ password });
}

export async function deleteUserHandler(c: Context<AppBindings>): Promise<Response> {
  const id = requiredParam(c, "id");
  const user = await c.env.DB.prepare("SELECT id,username,full_name,role,is_active FROM users WHERE id=?1 AND deleted_at IS NULL")
    .bind(id).first<{ id: string; username: string; full_name: string; role: string; is_active: number }>();
  if (!user) throw new HttpError(404, "Không tìm thấy nhân viên.");
  if (user.role !== "EMPLOYEE") throw new HttpError(409, "Chỉ được xóa tài khoản nhân viên.");
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET is_active=0,deleted_at=?1,updated_at=?1 WHERE id=?2 AND deleted_at IS NULL").bind(now, id),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id=?1").bind(id),
  ]);
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "USER_DELETED",
    entityType: "USER",
    entityId: id,
    oldData: user,
    newData: { deletedAt: now, deletionMode: "SOFT_DELETE" },
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true });
}

export async function listBranchesHandler(c: Context<AppBindings>): Promise<Response> {
  const { results } = await c.env.DB.prepare(`
    SELECT b.id,b.code,b.name,b.address,b.phone,b.is_active,b.created_at,COUNT(u.id) AS user_count
    FROM branches b LEFT JOIN users u ON u.branch_id=b.id AND u.deleted_at IS NULL
    WHERE b.deleted_at IS NULL AND b.code IN ('TP14','TP81') GROUP BY b.id ORDER BY b.code
  `).all<{ id: string; code: string; name: string; address: string; phone: string; is_active: number; created_at: string; user_count: number }>();
  return c.json({ branches: results.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address,
    phone: row.phone,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    userCount: row.user_count,
  })) });
}

export async function createBranchHandler(c: Context<AppBindings>): Promise<Response> {
  const parsed = branchInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu chi nhánh không hợp lệ.");
  const id = crypto.randomUUID();
  const now = isoNow();
  const canonical = officialBranch(parsed.data.code);
  if (!canonical) throw new HttpError(422, "Chi nhánh không hợp lệ.");
  try {
    await c.env.DB.prepare(`
      INSERT INTO branches(id,code,name,address,phone,is_active,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?7)
    `).bind(id, canonical.code, canonical.name, canonical.address, parsed.data.phone, parsed.data.isActive ? 1 : 0, now).run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) throw new HttpError(409, "Mã chi nhánh đã tồn tại.");
    throw error;
  }
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "BRANCH_CREATED",
    entityType: "BRANCH",
    entityId: id,
    newData: parsed.data,
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true, id }, 201);
}

export async function updateBranchHandler(c: Context<AppBindings>): Promise<Response> {
  const id = requiredParam(c, "id");
  const previous = await c.env.DB.prepare("SELECT id,code,name,address,phone,is_active FROM branches WHERE id=?1 AND deleted_at IS NULL")
    .bind(id).first();
  if (!previous) throw new HttpError(404, "Không tìm thấy chi nhánh.");
  const parsed = branchInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu chi nhánh không hợp lệ.");
  const now = isoNow();
  const canonical = officialBranch(parsed.data.code);
  if (!canonical) throw new HttpError(422, "Chi nhánh không hợp lệ.");
  try {
    await c.env.DB.prepare("UPDATE branches SET code=?1,name=?2,address=?3,phone=?4,is_active=?5,updated_at=?6 WHERE id=?7")
      .bind(canonical.code, canonical.name, canonical.address, parsed.data.phone, parsed.data.isActive ? 1 : 0, now, id).run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) throw new HttpError(409, "Mã chi nhánh đã tồn tại.");
    throw error;
  }
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "BRANCH_UPDATED",
    entityType: "BRANCH",
    entityId: id,
    oldData: previous,
    newData: parsed.data,
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true });
}

export async function auditLogsHandler(c: Context<AppBindings>): Promise<Response> {
  const query = c.req.query();
  const conditions = ["1=1"];
  const values: string[] = [];
  const bind = (sql: string, value: string) => {
    values.push(value);
    conditions.push(sql.replace("?", `?${values.length}`));
  };
  if (query.action) bind("a.action=?", query.action);
  if (query.actorUserId) bind("a.actor_user_id=?", query.actorUserId);
  if (query.entityId) bind("a.entity_id=?", query.entityId);
  const limitIndex = values.length + 1;
  const { results } = await c.env.DB.prepare(`
    SELECT a.id,a.action,a.entity_type,a.entity_id,a.old_data,a.new_data,a.request_id,a.created_at,u.full_name AS actor_name
    FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id
    WHERE ${conditions.join(" AND ")} ORDER BY a.created_at DESC LIMIT ?${limitIndex}
  `).bind(...values, String(Math.min(Math.max(Number(query.limit) || 100, 1), 500))).all<{
    id: string; action: string; entity_type: string; entity_id: string | null; old_data: string | null;
    new_data: string | null; request_id: string; created_at: string; actor_name: string | null;
  }>();
  return c.json({ logs: results.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldData: row.old_data ? JSON.parse(row.old_data) as unknown : null,
    newData: row.new_data ? JSON.parse(row.new_data) as unknown : null,
    requestId: row.request_id,
    createdAt: row.created_at,
    actorName: row.actor_name ?? "Hệ thống",
  })) });
}
