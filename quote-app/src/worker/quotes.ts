import type { Context } from "hono";
import {
  calculateLineTotal,
  calculateTotals,
  lifecycleStatusForPayment,
  normalizePayment,
  paymentStatusFromLegacyQuote,
  quantityFromMilli,
  quantityToMilli,
} from "../shared/calculations";
import { formatQuoteNumber } from "../shared/quote-number";
import type { PaymentStatus, QuoteItemInput, QuoteRecord, QuoteStatus, QuoteTotals, SessionUser, VatRate } from "../shared/types";
import { auditStatement, writeAudit } from "./audit";
import type { AppBindings } from "./auth";
import { customerUpsertStatement } from "./customers";
import { HttpError, isoNow, requiredParam } from "./http";
import { paymentUpdateSchema, quoteInputSchema } from "./schemas";

export type QuoteRow = {
  id: string;
  quote_number: string;
  branch_id: string;
  branch_code: string;
  branch_name: string;
  branch_address: string;
  branch_phone: string;
  created_by: string;
  employee_name: string;
  employee_phone: string;
  quote_date: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_note: string;
  general_note: string;
  old_debt_amount: number;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  processing_fee: number;
  vat_amount: number;
  vat_rate: VatRate | null;
  grand_total: number;
  deposit_amount: number;
  remaining_amount: number;
  status: QuoteStatus;
  payment_status: PaymentStatus;
  latest_pdf_key: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ItemRow = {
  id: string;
  position: number;
  product_name: string;
  specification: string;
  quantity_milli: number;
  unit: string;
  unit_price: number;
  line_total: number;
  note: string;
};

export const quoteSelect = `
  SELECT q.*, b.code AS branch_code, b.name AS branch_name, b.address AS branch_address, b.phone AS branch_phone,
    u.full_name AS employee_name, u.phone AS employee_phone
  FROM quotes q JOIN branches b ON b.id=q.branch_id JOIN users u ON u.id=q.created_by
`;

function compactDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) throw new HttpError(422, "Ngày lập không hợp lệ.");
  return `${day}${month}${year.slice(-2)}`;
}

export function mapQuote(row: QuoteRow, items: ItemRow[]): QuoteRecord {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    branchId: row.branch_id,
    branchCode: row.branch_code,
    branchName: row.branch_name,
    branchAddress: row.branch_address,
    branchPhone: row.branch_phone,
    createdBy: row.created_by,
    employeeName: row.employee_name,
    employeePhone: row.employee_phone,
    quoteDate: row.quote_date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    deliveryNote: row.delivery_note,
    generalNote: row.general_note,
    oldDebtAmount: row.old_debt_amount ?? 0,
    vatRate: row.vat_rate,
    status: row.status,
    paymentStatus: row.payment_status,
    totals: {
      subtotal: row.subtotal,
      discount: row.discount,
      shippingFee: row.shipping_fee,
      processingFee: row.processing_fee,
      vatAmount: row.vat_amount,
      grandTotal: row.grand_total,
      depositAmount: row.deposit_amount,
      remainingAmount: row.remaining_amount,
    },
    items: items.map((item) => ({
      id: item.id,
      position: item.position,
      productName: item.product_name,
      specification: item.specification,
      quantity: quantityFromMilli(item.quantity_milli),
      unit: item.unit,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
      note: item.note,
    })),
    latestPdfKey: row.latest_pdf_key,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolvePaymentStatus(
  requestedStatus: PaymentStatus | undefined,
  currentStatus: PaymentStatus | undefined,
  legacyStatus: QuoteStatus,
  totals: QuoteTotals,
): PaymentStatus {
  const paymentStatus = requestedStatus
    ?? (totals.depositAmount === 0
      ? "UNPAID"
      : totals.depositAmount === totals.grandTotal && totals.grandTotal > 0
        ? "PAID"
        : currentStatus === "PARTIAL"
          ? "PARTIAL"
          : paymentStatusFromLegacyQuote(legacyStatus, totals.depositAmount, totals.grandTotal));
  normalizePayment(paymentStatus, totals.depositAmount, totals.grandTotal);
  return paymentStatus;
}

export function canAccessQuote(user: SessionUser, createdBy: string): boolean {
  return user.role === "ADMIN" || user.id === createdBy;
}

export function canArchiveQuote(user: SessionUser, createdBy: string): boolean {
  return user.role === "EMPLOYEE" && user.id === createdBy;
}

export async function loadQuote(env: QuoteAppEnv, quoteId: string, user: SessionUser): Promise<QuoteRecord> {
  const row = await env.DB.prepare(`${quoteSelect} WHERE q.id=?1 AND q.deleted_at IS NULL`).bind(quoteId).first<QuoteRow>();
  if (!row || !canAccessQuote(user, row.created_by)) throw new HttpError(404, "Không tìm thấy báo giá.");
  const { results } = await env.DB.prepare(`
    SELECT id,position,product_name,specification,quantity_milli,unit,unit_price,line_total,note
    FROM quote_items WHERE quote_id=?1 AND deleted_at IS NULL ORDER BY position
  `).bind(quoteId).all<ItemRow>();
  return mapQuote(row, results);
}

function meaningfulItems(items: QuoteItemInput[]): QuoteItemInput[] {
  return items.filter((item) => item.productName || item.specification || item.quantity || item.unit || item.unitPrice || item.note);
}

async function branchForCreate(env: QuoteAppEnv, user: SessionUser, requestedBranchId?: string) {
  const branchId = user.role === "EMPLOYEE" ? user.branchId : requestedBranchId ?? "branch-tp81";
  if (!branchId) throw new HttpError(422, "Vui lòng chọn chi nhánh.");
  const branch = await env.DB.prepare("SELECT id,code,name FROM branches WHERE id=?1 AND is_active=1 AND deleted_at IS NULL")
    .bind(branchId).first<{ id: string; code: string; name: string }>();
  if (!branch) throw new HttpError(422, "Chi nhánh không hợp lệ hoặc đã bị khóa.");
  return branch;
}

async function createQuote(env: QuoteAppEnv, user: SessionUser, rawInput: unknown, requestId: string): Promise<QuoteRecord> {
  const parsed = quoteInputSchema.safeParse(rawInput);
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu báo giá không hợp lệ.");
  const input = parsed.data;
  const branch = await branchForCreate(env, user, input.branchId);
  const items = meaningfulItems(input.items);
  const totals = calculateTotals(items, input);
  const paymentStatus = resolvePaymentStatus(input.paymentStatus, undefined, "DRAFT", totals);
  const status = lifecycleStatusForPayment("DRAFT", paymentStatus, false);
  const counter = await env.DB.prepare(`
    INSERT INTO quote_counters(branch_id,quote_date,last_sequence) VALUES(?1,?2,1)
    ON CONFLICT(branch_id,quote_date) DO UPDATE SET last_sequence=last_sequence+1
    RETURNING last_sequence
  `).bind(branch.id, input.quoteDate).first<{ last_sequence: number }>();
  if (!counter) throw new HttpError(500, "Không thể cấp mã báo giá.");
  const quoteNumber = formatQuoteNumber(branch.code, compactDate(input.quoteDate), counter.last_sequence);
  const id = crypto.randomUUID();
  const revisionToken = crypto.randomUUID();
  const now = isoNow();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`
      INSERT INTO quotes(
        id,quote_number,branch_id,created_by,quote_date,customer_name,customer_phone,customer_address,
        delivery_note,general_note,subtotal,discount,shipping_fee,processing_fee,vat_amount,vat_rate,grand_total,deposit_amount,
        remaining_amount,status,payment_status,old_debt_amount,revision_token,created_at,updated_at
      ) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?24)
    `).bind(
      id, quoteNumber, branch.id, user.id, input.quoteDate, input.customerName, input.customerPhone,
      input.customerAddress, input.deliveryNote, input.generalNote, totals.subtotal, totals.discount, totals.shippingFee,
      totals.processingFee, totals.vatAmount, null, totals.grandTotal, totals.depositAmount, totals.remainingAmount,
      status, paymentStatus, input.oldDebtAmount, revisionToken, now,
    ),
  ];
  const customerStatement = customerUpsertStatement(env, {
    name: input.customerName,
    phone: input.customerPhone,
    address: input.customerAddress,
  });
  if (customerStatement) statements.push(customerStatement);
  items.forEach((item, index) => {
    statements.push(env.DB.prepare(`
      INSERT INTO quote_items(id,quote_id,position,product_name,specification,quantity_milli,unit,unit_price,line_total,note,created_at,updated_at)
      VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11)
    `).bind(
      crypto.randomUUID(), id, index + 1, item.productName, item.specification, quantityToMilli(item.quantity), item.unit, item.unitPrice,
      calculateLineTotal(item.quantity, item.unitPrice), item.note, now,
    ));
  });
  statements.push(auditStatement(env, {
    actorUserId: user.id,
    action: "QUOTE_CREATED",
    entityType: "QUOTE",
    entityId: id,
    newData: { quoteNumber, branchId: branch.id, totals, paymentStatus },
    requestId,
  }));
  await env.DB.batch(statements);
  return loadQuote(env, id, user);
}

export async function createQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await createQuote(c.env, c.get("user"), await c.req.json(), c.get("requestId"));
  return c.json({ quote }, 201);
}

export async function getQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  return c.json({ quote: await loadQuote(c.env, requiredParam(c, "id"), c.get("user")) });
}

export async function updateQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (quote.status === "CANCELLED") throw new HttpError(409, "Báo giá đã hủy. Admin cần khôi phục trước khi chỉnh sửa.");
  const parsed = quoteInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu báo giá không hợp lệ.");
  const input = parsed.data;
  if (input.version !== quote.version) throw new HttpError(409, "Báo giá đã thay đổi ở nơi khác. Vui lòng tải lại trước khi lưu.");
  const items = meaningfulItems(input.items);
  const totals = calculateTotals(items, input);
  const versionRow = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM quote_versions WHERE quote_id=?1")
    .bind(quote.id).first<{ count: number }>();
  const hasIssuedVersion = Number(versionRow?.count ?? 0) > 0;
  const paymentStatus = resolvePaymentStatus(input.paymentStatus, quote.paymentStatus, quote.status, totals);
  const status = lifecycleStatusForPayment(quote.status, paymentStatus, hasIssuedVersion);
  const now = isoNow();
  const revisionToken = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(`
      UPDATE quotes SET customer_name=?1,customer_phone=?2,customer_address=?3,delivery_note=?4,general_note=?5,
        subtotal=?6,discount=?7,shipping_fee=?8,processing_fee=?9,vat_amount=?10,vat_rate=?11,grand_total=?12,deposit_amount=?13,
        remaining_amount=?14,status=?15,payment_status=?16,old_debt_amount=?17,revision_token=?18,version=version+1,updated_at=?19 WHERE id=?20 AND version=?21
    `).bind(
      input.customerName, input.customerPhone, input.customerAddress, input.deliveryNote, input.generalNote,
      totals.subtotal, totals.discount, totals.shippingFee, totals.processingFee, totals.vatAmount, null,
      totals.grandTotal, totals.depositAmount, totals.remainingAmount, status, paymentStatus, input.oldDebtAmount, revisionToken, now, quote.id, input.version,
    ),
    c.env.DB.prepare(`
      UPDATE quote_items SET deleted_at=?1,updated_at=?1
      WHERE quote_id=?2 AND deleted_at IS NULL
        AND EXISTS(SELECT 1 FROM quotes WHERE id=?2 AND revision_token=?3)
    `).bind(now, quote.id, revisionToken),
  ];
  items.forEach((item, index) => {
    statements.push(c.env.DB.prepare(`
      INSERT INTO quote_items(id,quote_id,position,product_name,specification,quantity_milli,unit,unit_price,line_total,note,created_at,updated_at)
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11
      WHERE EXISTS(SELECT 1 FROM quotes WHERE id=?2 AND revision_token=?12)
    `).bind(
      crypto.randomUUID(), quote.id, index + 1, item.productName, item.specification, quantityToMilli(item.quantity), item.unit,
      item.unitPrice, calculateLineTotal(item.quantity, item.unitPrice), item.note, now, revisionToken,
    ));
  });
  const customerStatement = customerUpsertStatement(c.env, {
    name: input.customerName,
    phone: input.customerPhone,
    address: input.customerAddress,
  }, { quoteId: quote.id, revisionToken });
  if (customerStatement) statements.push(customerStatement);
  statements.push(c.env.DB.prepare(`
    INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,old_data,new_data,request_id,created_at)
    SELECT ?1,?2,'QUOTE_UPDATED','QUOTE',?3,?4,?5,?6,?7
    WHERE EXISTS(SELECT 1 FROM quotes WHERE id=?3 AND revision_token=?8)
  `).bind(
    crypto.randomUUID(), c.get("user").id, quote.id, JSON.stringify(quote), JSON.stringify({ ...input, totals, status, paymentStatus }),
    c.get("requestId"), now, revisionToken,
  ));
  const results = await c.env.DB.batch(statements);
  if (Number(results[0]?.meta.changes ?? 0) !== 1) throw new HttpError(409, "Báo giá đã thay đổi ở nơi khác. Vui lòng tải lại trước khi lưu.");
  return c.json({ quote: await loadQuote(c.env, quote.id, c.get("user")) });
}

export async function updatePaymentHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (quote.status === "CANCELLED") throw new HttpError(409, "Báo giá đã hủy, không thể cập nhật thanh toán.");
  const parsed = paymentUpdateSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Dữ liệu thanh toán không hợp lệ.");
  if (parsed.data.version !== quote.version) throw new HttpError(409, "Báo giá đã thay đổi ở nơi khác. Vui lòng tải lại trước khi cập nhật.");
  const normalized = normalizePayment(parsed.data.paymentStatus, parsed.data.receivedAmount, quote.totals.grandTotal);
  const versionRow = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM quote_versions WHERE quote_id=?1")
    .bind(quote.id).first<{ count: number }>();
  const status = lifecycleStatusForPayment(quote.status, parsed.data.paymentStatus, Number(versionRow?.count ?? 0) > 0);
  const now = isoNow();
  const revisionToken = crypto.randomUUID();
  const results = await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE quotes SET deposit_amount=?1,remaining_amount=?2,payment_status=?3,status=?4,revision_token=?5,
        version=version+1,updated_at=?6 WHERE id=?7 AND version=?8 AND deleted_at IS NULL
    `).bind(
      normalized.receivedAmount, normalized.remainingAmount, parsed.data.paymentStatus, status, revisionToken,
      now, quote.id, parsed.data.version,
    ),
    c.env.DB.prepare(`
      INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,old_data,new_data,request_id,created_at)
      SELECT ?1,?2,'QUOTE_PAYMENT_UPDATED','QUOTE',?3,?4,?5,?6,?7
      WHERE EXISTS(SELECT 1 FROM quotes WHERE id=?3 AND revision_token=?8)
    `).bind(
      crypto.randomUUID(), c.get("user").id, quote.id,
      JSON.stringify({ paymentStatus: quote.paymentStatus, receivedAmount: quote.totals.depositAmount, remainingAmount: quote.totals.remainingAmount }),
      JSON.stringify({ paymentStatus: parsed.data.paymentStatus, receivedAmount: normalized.receivedAmount, remainingAmount: normalized.remainingAmount }),
      c.get("requestId"), now, revisionToken,
    ),
  ]);
  if (Number(results[0]?.meta.changes ?? 0) !== 1) throw new HttpError(409, "Báo giá đã thay đổi ở nơi khác. Vui lòng tải lại trước khi cập nhật.");
  return c.json({ quote: await loadQuote(c.env, quote.id, c.get("user")) });
}

export async function listQuotesHandler(c: Context<AppBindings>): Promise<Response> {
  const user = c.get("user");
  const query = c.req.query();
  const conditions = ["q.deleted_at IS NULL"];
  const values: Array<string | number> = [];
  const bind = (condition: string, value: string | number) => {
    values.push(value);
    conditions.push(condition.replace("?", `?${values.length}`));
  };
  for (const [key, max] of [["from", 10], ["to", 10], ["employeeId", 100], ["branchId", 100], ["status", 20], ["paymentStatus", 20], ["quoteNumber", 50], ["customerName", 200], ["customerPhone", 30]] as const) {
    if (query[key] && query[key].length > max) throw new HttpError(422, "Bộ lọc tìm kiếm quá dài.");
  }
  if (user.role === "EMPLOYEE") bind("q.created_by=?", user.id);
  if (query.from) bind("q.quote_date>=?", query.from);
  if (query.to) bind("q.quote_date<=?", query.to);
  if (query.employeeId && user.role === "ADMIN") bind("q.created_by=?", query.employeeId);
  if (query.branchId) bind("q.branch_id=?", query.branchId);
  if (query.status) bind("q.status=?", query.status);
  if (query.paymentStatus) bind("q.payment_status=?", query.paymentStatus);
  if (query.quoteNumber) bind("q.quote_number LIKE ?", `%${query.quoteNumber}%`);
  if (query.customerName) bind("q.customer_name LIKE ?", `%${query.customerName}%`);
  if (query.customerPhone) bind("q.customer_phone LIKE ?", `%${query.customerPhone}%`);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  values.push(limit);
  const sql = `${quoteSelect} WHERE ${conditions.join(" AND ")} ORDER BY q.quote_date DESC,q.created_at DESC LIMIT ?${values.length}`;
  const { results } = await c.env.DB.prepare(sql).bind(...values).all<QuoteRow>();
  return c.json({ quotes: results.map((row) => mapQuote(row, [])) });
}

export async function cancelQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (quote.status === "CANCELLED") return c.json({ quote });
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE quotes SET pre_cancel_status=status,status='CANCELLED',cancelled_at=?1,cancelled_by=?2,updated_at=?1 WHERE id=?3")
      .bind(now, c.get("user").id, quote.id),
    auditStatement(c.env, {
      actorUserId: c.get("user").id,
      action: "QUOTE_CANCELLED",
      entityType: "QUOTE",
      entityId: quote.id,
      oldData: { status: quote.status },
      newData: { status: "CANCELLED" },
      requestId: c.get("requestId"),
    }),
  ]);
  return c.json({ quote: await loadQuote(c.env, quote.id, c.get("user")) });
}

export async function restoreQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (quote.status !== "CANCELLED") return c.json({ quote });
  const row = await c.env.DB.prepare("SELECT pre_cancel_status FROM quotes WHERE id=?1").bind(quote.id)
    .first<{ pre_cancel_status: QuoteStatus | null }>();
  const restoredStatus = row?.pre_cancel_status && row.pre_cancel_status !== "CANCELLED" ? row.pre_cancel_status : "DRAFT";
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE quotes SET status=?1,pre_cancel_status=NULL,cancelled_at=NULL,cancelled_by=NULL,updated_at=?2 WHERE id=?3")
      .bind(restoredStatus, now, quote.id),
    auditStatement(c.env, {
      actorUserId: c.get("user").id,
      action: "QUOTE_RESTORED",
      entityType: "QUOTE",
      entityId: quote.id,
      oldData: { status: "CANCELLED" },
      newData: { status: restoredStatus },
      requestId: c.get("requestId"),
    }),
  ]);
  return c.json({ quote: await loadQuote(c.env, quote.id, c.get("user")) });
}

export async function duplicateQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const source = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  const quoteDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const quote = await createQuote(c.env, c.get("user"), {
    branchId: source.branchId,
    quoteDate,
    customerName: source.customerName,
    customerPhone: source.customerPhone,
    customerAddress: source.customerAddress,
    deliveryNote: source.deliveryNote,
    generalNote: source.generalNote,
    oldDebtAmount: source.oldDebtAmount ?? 0,
    discount: source.totals.discount,
    shippingFee: source.totals.shippingFee,
    processingFee: source.totals.processingFee,
    vatAmount: source.totals.vatAmount,
    vatRate: null,
    depositAmount: 0,
    paymentStatus: "UNPAID",
    items: source.items,
  }, c.get("requestId"));
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "QUOTE_DUPLICATED",
    entityType: "QUOTE",
    entityId: quote.id,
    oldData: { sourceQuoteId: source.id },
    newData: { quoteNumber: quote.quoteNumber },
    requestId: c.get("requestId"),
  });
  return c.json({ quote }, 201);
}

export async function deleteQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE quotes SET deleted_at=?1,updated_at=?1 WHERE id=?2 AND deleted_at IS NULL")
      .bind(now, quote.id),
    auditStatement(c.env, {
      actorUserId: c.get("user").id,
      action: "QUOTE_DELETED",
      entityType: "QUOTE",
      entityId: quote.id,
      oldData: { quoteNumber: quote.quoteNumber, status: quote.status },
      newData: { deletedAt: now, deletionMode: "SOFT_DELETE" },
      requestId: c.get("requestId"),
    }),
  ]);
  return c.json({ ok: true });
}

export async function archiveQuoteHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (!canArchiveQuote(c.get("user"), quote.createdBy)) throw new HttpError(403, "Chỉ nhân viên sở hữu báo giá mới được lưu trữ.");
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE quotes SET deleted_at=?1,updated_at=?1 WHERE id=?2 AND deleted_at IS NULL")
      .bind(now, quote.id),
    auditStatement(c.env, {
      actorUserId: c.get("user").id,
      action: "QUOTE_ARCHIVED",
      entityType: "QUOTE",
      entityId: quote.id,
      oldData: { quoteNumber: quote.quoteNumber, status: quote.status },
      newData: { archivedAt: now, deletionMode: "ARCHIVE" },
      requestId: c.get("requestId"),
    }),
  ]);
  return c.json({ ok: true });
}
