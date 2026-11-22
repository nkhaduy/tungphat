type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type StoredDraft = { version: number | null; form: unknown; updatedAt?: number; creationKey?: string; quoteId?: string };

export function draftKey(userId: string, quoteId?: string): string {
  return `tp-quote-draft-v2:${encodeURIComponent(userId)}:${encodeURIComponent(quoteId ?? "new")}`;
}

export function editDraftPrefix(userId: string, quoteId: string): string {
  return `tp-edit-quote-draft:${encodeURIComponent(userId)}:${encodeURIComponent(quoteId)}:`;
}

export function listEditDrafts(storage: Storage, userId: string, quoteId: string): Array<{ key: string; raw: string; draft: StoredDraft }> {
  const prefix = editDraftPrefix(userId, quoteId);
  const results: Array<{ key: string; raw: string; draft: StoredDraft }> = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const raw = storage.getItem(key);
    const draft = readDraft(storage, key);
    if (raw && draft && (quoteId === "new" || draft.version !== null)) results.push({ key, raw, draft });
  }
  return results.sort((a, b) => (b.draft.updatedAt ?? 0) - (a.draft.updatedAt ?? 0));
}

export function writeDraft(storage: DraftStorage, key: string, draft: StoredDraft): void {
  storage.setItem(key, JSON.stringify(draft));
}

export function readDraft(storage: DraftStorage, key: string): StoredDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as StoredDraft;
    if (!draft || typeof draft.form !== "object" || !draft.form || !(draft.version === null || (Number.isSafeInteger(draft.version) && draft.version > 0))) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearSavedDraft(storage: DraftStorage, key: string, snapshot: string | null): void {
  if (snapshot !== null && storage.getItem(key) === snapshot) storage.removeItem(key);
}

export function creationKey(storage: DraftStorage, userId: string, durable: DraftStorage = storage): string {
  const key = `${draftKey(userId)}:create-key`;
  const existing = storage.getItem(key);
  if (existing) {
    if (!durable.getItem(key)) durable.setItem(key, existing);
    return existing;
  }
  const value = durable.getItem(key) ?? crypto.randomUUID();
  durable.setItem(key, value);
  storage.setItem(key, value);
  return value;
}

export function clearCreationKey(storage: DraftStorage, userId: string, value: string, durable: DraftStorage = storage): void {
  clearSavedDraft(storage, `${draftKey(userId)}:create-key`, value);
  clearSavedDraft(durable, `${draftKey(userId)}:create-key`, value);
}
