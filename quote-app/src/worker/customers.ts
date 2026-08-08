import type { Context } from "hono";
import type { CustomerRecord } from "../shared/types";
import type { AppBindings } from "./auth";
import { HttpError, isoNow } from "./http";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function customerIdentity(name: string, phone: string, address: string): string | null {
  const normalizedPhone = normalizePhone(phone);
  const normalizedName = normalizeText(name);
  const normalizedAddress = normalizeText(address);
  if (normalizedPhone && normalizedName) return `contact:${normalizedPhone}|${normalizedName}`;
  if (normalizedPhone) return `phone:${normalizedPhone}`;
  if (!normalizedName && !normalizedAddress) return null;
  return `details:${normalizedName}|${normalizedAddress}`;
}

export function customerUpsertStatement(
  env: QuoteAppEnv,
  customer: { name: string; phone: string; address: string },
  guard?: { quoteId: string; revisionToken: string },
): D1PreparedStatement | null {
  const identityKey = customerIdentity(customer.name, customer.phone, customer.address);
  if (!identityKey) return null;
  const normalizedName = normalizeText(customer.name);
  const normalizedPhone = normalizePhone(customer.phone);
  const searchText = normalizeText(`${customer.name} ${customer.phone} ${customer.address}`);
  const now = isoNow();
  if (guard) {
    return env.DB.prepare(`
      INSERT INTO customers(id,identity_key,name,phone,address,normalized_name,normalized_phone,search_text,created_at,updated_at)
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?9
      WHERE EXISTS(SELECT 1 FROM quotes WHERE id=?10 AND revision_token=?11)
      ON CONFLICT(identity_key) DO UPDATE SET
        name=excluded.name,phone=excluded.phone,address=excluded.address,
        normalized_name=excluded.normalized_name,normalized_phone=excluded.normalized_phone,
        search_text=excluded.search_text,updated_at=excluded.updated_at
    `).bind(
      crypto.randomUUID(), identityKey, customer.name, customer.phone, customer.address,
      normalizedName, normalizedPhone, searchText, now, guard.quoteId, guard.revisionToken,
    );
  }
  return env.DB.prepare(`
    INSERT INTO customers(id,identity_key,name,phone,address,normalized_name,normalized_phone,search_text,created_at,updated_at)
    VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)
    ON CONFLICT(identity_key) DO UPDATE SET
      name=excluded.name,phone=excluded.phone,address=excluded.address,
      normalized_name=excluded.normalized_name,normalized_phone=excluded.normalized_phone,
      search_text=excluded.search_text,updated_at=excluded.updated_at
  `).bind(
    crypto.randomUUID(), identityKey, customer.name, customer.phone, customer.address,
    normalizedName, normalizedPhone, searchText, now,
  );
}

export async function listCustomersHandler(c: Context<AppBindings>): Promise<Response> {
  const rawQuery = c.req.query("q")?.trim() ?? "";
  if (rawQuery.length > 100) throw new HttpError(422, "Từ khóa khách hàng quá dài.");
  const normalizedQuery = normalizeText(rawQuery);
  const normalizedPhone = normalizePhone(rawQuery);
  const conditions: string[] = [];
  const values: string[] = [];
  if (normalizedQuery) {
    values.push(`%${normalizedQuery}%`);
    conditions.push(`search_text LIKE ?${values.length}`);
  }
  if (normalizedPhone) {
    values.push(`%${normalizedPhone}%`);
    conditions.push(`normalized_phone LIKE ?${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" OR ")}` : "";
  const limitIndex = values.length + 1;
  const { results } = await c.env.DB.prepare(`
    SELECT id,name,phone,address,updated_at
    FROM customers
    ${where}
    ORDER BY updated_at DESC
    LIMIT ?${limitIndex}
  `).bind(...values, 12).all<{
    id: string;
    name: string;
    phone: string;
    address: string;
    updated_at: string;
  }>();
  const customers: CustomerRecord[] = results.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    updatedAt: row.updated_at,
  }));
  return c.json({ customers });
}
