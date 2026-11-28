import { describe, expect, it } from "vitest";
import { quoteInputSchema } from "../src/worker/schemas";

const input = {
  quoteDate: "2026-11-18", customerName: "Khách thử", customerPhone: "", customerAddress: "",
  deliveryNote: "", generalNote: "", discount: 0, shippingFee: 0, processingFee: 0,
  vatAmount: 0, depositAmount: 0, paymentStatus: "UNPAID",
  items: [{ productName: "MDF", specification: "", quantity: 1, unit: "tấm", unitPrice: 100, discountPercent: 0, note: "" }],
};

describe("quote save validation", () => {
  it("rejects invalid financial totals as validation failures", () => {
    expect(quoteInputSchema.safeParse({ ...input, discount: 101 }).success).toBe(false);
    expect(quoteInputSchema.safeParse({ ...input, depositAmount: 101 }).success).toBe(false);
    expect(quoteInputSchema.safeParse({ ...input, paymentStatus: "PAID" }).success).toBe(false);
  });
});

describe("editor save payload", () => {
  it("does not send the empty spreadsheet row against the 500 product limit", async () => {
    const { payload } = await import("../src/client/pages/QuoteEditorPage");
    const rows = Array.from({ length: 500 }, (_, i) => ({ clientId: String(i), ...input.items[0] }));
    rows.push({ clientId: "blank", productName: "", specification: "", quantity: 0, unit: "", unitPrice: 0, discountPercent: 0, note: "" });
    const body = payload({ ...input, oldDebtAmount: 0, branchId: "branch", paymentStatus: "UNPAID", rows });
    expect(body.items).toHaveLength(500);
    expect(quoteInputSchema.safeParse(body).success).toBe(true);
  });
});

describe("per-tab draft recovery", () => {
  it("retains newer edits when an older save finishes and isolates users and quotes", async () => {
    const { draftKey, clearSavedDraft, readDraft, writeDraft } = await import("../src/client/quote-draft");
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
    const key = draftKey("user-a", "quote-a");
    writeDraft(storage, key, { version: 2, form: { customerName: "first" } });
    const savedSnapshot = storage.getItem(key);
    writeDraft(storage, key, { version: 2, form: { customerName: "newer" } });
    clearSavedDraft(storage, key, savedSnapshot);
    expect(readDraft(storage, key)?.form).toEqual({ customerName: "newer" });
    expect(readDraft(storage, draftKey("user-b", "quote-a"))).toBeNull();
    expect(readDraft(storage, draftKey("user-a", "quote-b"))).toBeNull();
    clearSavedDraft(storage, key, storage.getItem(key));
    expect(readDraft(storage, key)).toBeNull();
  });
});

describe("session recovery", () => {
  it("never sends a write when the reauthenticated account differs", async () => {
    const { refreshSessionForUser, setCsrfToken } = await import("../src/client/api");
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = () => { calls += 1; return Promise.resolve(new Response(JSON.stringify({ user: { id: "other" }, csrf: "other-token" }), { status: 200 })); };
    try {
      setCsrfToken("old-token");
      await expect(refreshSessionForUser("owner")).rejects.toThrow();
      expect(calls).toBe(1);
    } finally { globalThis.fetch = original; }
  });
});

describe("creation request key", () => {
  it("survives a retry in the same tab and is cleared only after confirmation", async () => {
    const { creationKey, clearCreationKey } = await import("../src/client/quote-draft");
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
    const first = creationKey(storage, "user-a");
    expect(creationKey(storage, "user-a")).toBe(first);
    expect(creationKey(storage, "user-b")).not.toBe(first);
    clearCreationKey(storage, "user-a", first);
    expect(creationKey(storage, "user-a")).not.toBe(first);
  });
});

describe("creation key after tab close", () => {
  it("reuses the durable key when the unsaved draft is reopened in another tab", async () => {
    const { creationKey, clearCreationKey } = await import("../src/client/quote-draft");
    const makeStorage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } }; };
    const durable = makeStorage();
    const first = creationKey(makeStorage(), "owner", durable);
    expect(creationKey(makeStorage(), "owner", durable)).toBe(first);
    expect(creationKey(makeStorage(), "other", durable)).not.toBe(first);
    clearCreationKey(makeStorage(), "owner", first, durable);
    expect(creationKey(makeStorage(), "owner", durable)).not.toBe(first);
  });
  it("persists an existing per-tab key when durable storage was previously empty", async () => {
    const { creationKey } = await import("../src/client/quote-draft");
    const makeStorage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } }; };
    const tab = makeStorage();
    const first = creationKey(tab, "owner");
    const durable = makeStorage();
    expect(creationKey(tab, "owner", durable)).toBe(first);
    expect(creationKey(makeStorage(), "owner", durable)).toBe(first);
  });
});

describe("quote update audit privacy", () => {
  it("records state and item counts without customer or product details", async () => {
    const { quoteAuditSummary } = await import("../src/worker/quotes");
    const audit = quoteAuditSummary({ status: "DRAFT", paymentStatus: "UNPAID", version: 3, itemCount: 2 });
    expect(audit).toEqual({ status: "DRAFT", paymentStatus: "UNPAID", version: 3, itemCount: 2 });
    expect(JSON.stringify(audit)).not.toMatch(/customer|phone|product|address/i);
  });
});

describe("durable edit drafts", () => {
  it("keeps separate tab drafts scoped to a user and quote", async () => {
    const { editDraftPrefix, listEditDrafts, writeDraft, clearSavedDraft } = await import("../src/client/quote-draft");
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() { return values.size; }, clear() { values.clear(); }, key(i) { return [...values.keys()][i] ?? null; },
      getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, value); }, removeItem(key) { values.delete(key); },
    };
    const a = `${editDraftPrefix("alice", "quote")}tab-a`;
    const b = `${editDraftPrefix("alice", "quote")}tab-b`;
    const other = `${editDraftPrefix("bob", "quote")}tab-b`;
    writeDraft(storage, a, { version: 1, form: { note: "A" }, updatedAt: 1 });
    writeDraft(storage, b, { version: 1, form: { note: "B" }, updatedAt: 2 });
    writeDraft(storage, other, { version: 1, form: { note: "private" }, updatedAt: 3 });
    const found = listEditDrafts(storage, "alice", "quote");
    expect(found.map((draft) => draft.draft.form)).toEqual([{ note: "B" }, { note: "A" }]);
    clearSavedDraft(storage, a, storage.getItem(a));
    expect(listEditDrafts(storage, "alice", "quote")).toHaveLength(1);
    expect(listEditDrafts(storage, "bob", "quote")).toHaveLength(1);
  });
});
