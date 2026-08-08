import type { Context } from "hono";
import type { AppSettings } from "../shared/types";
import { writeAudit } from "./audit";
import type { AppBindings } from "./auth";
import { HttpError, isoNow } from "./http";
import { validateRasterImage } from "./images";
import { settingsInputSchema } from "./schemas";

const fallbackSettings: AppSettings = {
  company: {
    name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ GỖ TÙNG PHÁT",
    address: "81B Tam Bình, Hiệp Bình, TP.HCM",
    phone: "0909 259 160",
    headerContactName: "Mr. Tùng",
    headerPhone: "0909 259 160",
    website: "mdftungphat.com",
    logoPath: "/logo-horizontal.png",
  },
  bank: {
    accountNumber: "3191158",
    bankCode: "ACB",
    holder: "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT",
    store: "TUNG PHAT",
  },
  defaults: { generalNote: "", deliveryNote: "" },
};

export async function getSettings(env: QuoteAppEnv): Promise<AppSettings> {
  const { results } = await env.DB.prepare("SELECT key, value_json FROM settings WHERE key IN ('company','bank','defaults')").all<{
    key: keyof AppSettings; value_json: string;
  }>();
  const settings = structuredClone(fallbackSettings);
  for (const row of results) {
    try {
      if (row.key === "company") settings.company = { ...settings.company, ...JSON.parse(row.value_json) as AppSettings["company"] };
      if (row.key === "bank") settings.bank = { ...settings.bank, ...JSON.parse(row.value_json) as AppSettings["bank"] };
      if (row.key === "defaults") settings.defaults = { ...settings.defaults, ...JSON.parse(row.value_json) as AppSettings["defaults"] };
    } catch {
      // Keep safe defaults when a setting row is malformed.
    }
  }
  return settings;
}

export async function getSettingsHandler(c: Context<AppBindings>): Promise<Response> {
  return c.json({ settings: await getSettings(c.env) });
}

export async function updateSettingsHandler(c: Context<AppBindings>): Promise<Response> {
  const previous = await getSettings(c.env);
  const parsed = settingsInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Cài đặt không hợp lệ.");
  const settings: AppSettings = {
    ...parsed.data,
    company: { ...parsed.data.company, logoKey: previous.company.logoKey ?? null },
  };
  const now = isoNow();
  await c.env.DB.batch((Object.entries(settings) as Array<[keyof AppSettings, AppSettings[keyof AppSettings]]>).map(([key, value]) =>
    c.env.DB.prepare(`
      INSERT INTO settings(key,value_json,updated_by,created_at,updated_at) VALUES(?1,?2,?3,?4,?4)
      ON CONFLICT(key) DO UPDATE SET value_json=?2,updated_by=?3,updated_at=?4
    `).bind(key, JSON.stringify(value), c.get("user").id, now)
  ));
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "SETTINGS_UPDATED",
    entityType: "SETTINGS",
    oldData: previous,
    newData: settings,
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true, settings });
}

export async function uploadLogoHandler(c: Context<AppBindings>): Promise<Response> {
  const form = await c.req.formData();
  const file = form.get("logo");
  if (!(file instanceof File)) throw new HttpError(422, "Vui lòng chọn file logo.");
  if (!new Set(["image/png", "image/jpeg"]).has(file.type) || file.size > 2 * 1024 * 1024) {
    throw new HttpError(422, "Logo phải là PNG hoặc JPEG và không vượt quá 2 MB.");
  }
  const bytes = await file.arrayBuffer();
  const image = validateRasterImage(bytes, file.type);
  const extension = image.contentType === "image/png" ? "png" : "jpg";
  const key = `settings/logo/${crypto.randomUUID()}.${extension}`;
  await c.env.PDF_BUCKET.put(key, bytes, { httpMetadata: { contentType: image.contentType }, customMetadata: { kind: "company-logo" } });
  const current = await getSettings(c.env);
  const previousKey = "logoKey" in current.company && typeof current.company.logoKey === "string" ? current.company.logoKey : null;
  const nextCompany = { ...current.company, logoKey: key };
  const now = isoNow();
  await c.env.DB.prepare("UPDATE settings SET value_json=?1,updated_by=?2,updated_at=?3 WHERE key='company'")
    .bind(JSON.stringify(nextCompany), c.get("user").id, now).run();
  await writeAudit(c.env, {
    actorUserId: c.get("user").id,
    action: "LOGO_UPDATED",
    entityType: "SETTINGS",
    oldData: { logoKey: previousKey },
    newData: { logoKey: key },
    requestId: c.get("requestId"),
  });
  return c.json({ ok: true, logoKey: key });
}

export async function serveLogoHandler(c: Context<AppBindings>): Promise<Response> {
  const settings = await getSettings(c.env);
  const logoKey = "logoKey" in settings.company && typeof settings.company.logoKey === "string" ? settings.company.logoKey : null;
  if (!logoKey) return c.env.ASSETS.fetch(new URL(settings.company.logoPath, c.req.url));
  const object = await c.env.PDF_BUCKET.get(logoKey);
  if (!object) throw new HttpError(404, "Không tìm thấy logo.");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=300");
  return new Response(object.body, { headers });
}
