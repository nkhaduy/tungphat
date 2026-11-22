import { Check, Eye, FileDown, Printer, Save, Wifi } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { calculateLineTotal, calculateTotals, formatVnd, formatVndInput, parseVndInput } from "../../shared/calculations";
import { buildQuotePdfFilename, formatEmployeeContact } from "../../shared/display";
import type { AppSettings, CustomerRecord, PaymentStatus, QuoteRecord } from "../../shared/types";
import { ApiError, api, apiWithTimeout, downloadProtected, refreshSessionForUser } from "../api";
import { clearCreationKey, clearSavedDraft, draftKey as makeDraftKey, editDraftPrefix, listEditDrafts, readDraft, writeDraft } from "../quote-draft";
import { numericInputError } from "../numeric-input";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { PaymentActions } from "../components/PaymentActions";
import { emptyRow, QuoteGrid, type EditorRow } from "../components/QuoteGrid";

type QuoteForm = {
  branchId: string;
  quoteDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryNote: string;
  generalNote: string;
  oldDebtAmount: number;
  discount: number;
  shippingFee: number;
  processingFee: number;
  vatAmount: number;
  depositAmount: number;
  paymentStatus: PaymentStatus;
  rows: EditorRow[];
};

type Meta = { settings: AppSettings; branches: Array<{ id: string; code: string; name: string }> };

function dateInVietnam(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

function blankForm(meta: Meta): QuoteForm {
  const quoteDate = dateInVietnam();
  return {
    branchId: meta.branches.find((branch) => branch.code === "TP81")?.id ?? meta.branches[0]?.id ?? "",
    quoteDate,
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    deliveryNote: meta.settings.defaults.deliveryNote,
    generalNote: meta.settings.defaults.generalNote,
    oldDebtAmount: 0,
    discount: 0,
    shippingFee: 0,
    processingFee: 0,
    vatAmount: 0,
    depositAmount: 0,
    paymentStatus: "UNPAID",
    rows: [emptyRow()],
  };
}

function quoteToForm(quote: QuoteRecord): QuoteForm {
  return {
    branchId: quote.branchId,
    quoteDate: quote.quoteDate,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerAddress: quote.customerAddress,
    deliveryNote: quote.deliveryNote,
    generalNote: quote.generalNote,
    oldDebtAmount: quote.oldDebtAmount ?? 0,
    discount: quote.totals.discount,
    shippingFee: quote.totals.shippingFee,
    processingFee: quote.totals.processingFee,
    vatAmount: quote.totals.vatAmount,
    depositAmount: quote.totals.depositAmount,
    paymentStatus: quote.paymentStatus,
    rows: [...quote.items.map((item) => ({ ...item, clientId: item.id })), emptyRow()],
  };
}

export function payload(form: QuoteForm, version?: number) {
  return {
    version,
    branchId: form.branchId,
    quoteDate: form.quoteDate,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerAddress: form.customerAddress,
    deliveryNote: form.deliveryNote,
    generalNote: form.generalNote,
    oldDebtAmount: form.oldDebtAmount,
    discount: form.discount,
    shippingFee: form.shippingFee,
    processingFee: form.processingFee,
    vatAmount: form.vatAmount,
    vatRate: null,
    depositAmount: form.depositAmount,
    paymentStatus: form.paymentStatus,
    items: form.rows.filter((item) => item.productName || item.specification || item.quantity || item.unit || item.unitPrice || item.note).map((item) => ({
      productName: item.productName,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      note: item.note,
    })),
  };
}

function cachedForm(raw: string | null, meta: Meta): QuoteForm {
  const fallback = blankForm(meta);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<QuoteForm>;
    const rows = Array.isArray(parsed.rows) ? parsed.rows.map((row) => ({ ...emptyRow(), ...row })) : fallback.rows;
    return { ...fallback, ...parsed, rows: rows.length ? rows : fallback.rows };
  } catch {
    return fallback;
  }
}

type MoneyInputProps = {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function MoneyInput({ name, label, value, onChange }: MoneyInputProps) {
  const [inputError, setInputError] = useState("");
  return (
    <label className="money-input">
      <span>{label}</span>
      <input name={name} inputMode="numeric" value={value ? formatVndInput(value) : ""} onChange={(event) => {
        const invalid = numericInputError("money", event.target.value);
        if (invalid) { setInputError(invalid); return; }
        setInputError("");
        onChange(parseVndInput(event.target.value));
      }} />
      <small>đ</small>
      {inputError && <span role="alert">{inputError}</span>}
    </label>
  );
}

export function QuoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `tp-new-quote-draft:${user?.id ?? "unknown"}`;
  const tabDraftKey = makeDraftKey(user?.id ?? "unknown", id);
  const [form, setForm] = useState<QuoteForm | null>(null);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [recoveredPending, setRecoveredPending] = useState(false);
  const [recoverableDrafts, setRecoverableDrafts] = useState<ReturnType<typeof listEditDrafts>>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorRequestId, setErrorRequestId] = useState("");
  const [sessionProblem, setSessionProblem] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerRecord[]>([]);
  const [customerSuggestionsOpen, setCustomerSuggestionsOpen] = useState(false);
  const formRef = useRef<QuoteForm | null>(null);
  const quoteRef = useRef<QuoteRecord | null>(null);
  const dirtyRef = useRef(false);
  const editRevisionRef = useRef(0);
  const savePromiseRef = useRef<Promise<QuoteRecord | null> | null>(null);
  const creationKeyRef = useRef("");
  const legacySnapshotRef = useRef<string | null>(null);
  const editDraftKeyRef = useRef("");
  formRef.current = form;
  quoteRef.current = quote;

  const currentEditDraftKey = useCallback(() => {
    if (!user) return "";
    const prefix = editDraftPrefix(user.id, id ?? "new");
    if (!editDraftKeyRef.current.startsWith(prefix)) editDraftKeyRef.current = `${prefix}${crypto.randomUUID()}`;
    return editDraftKeyRef.current;
  }, [id, user]);

  useEffect(() => {
    void (async () => {
      try {
        const nextMeta = await api<Meta>("/api/meta");
        setMeta(nextMeta);
        if (id) {
          const result = await api<{ quote: QuoteRecord }>(`/api/quotes/${id}`);
          try { if (user) setRecoverableDrafts(listEditDrafts(localStorage, user.id, id)); }
          catch { setError("Không thể đọc bản nháp trên thiết bị. Hãy giữ trang mở khi chỉnh sửa."); }
          const recovered = readDraft(sessionStorage, tabDraftKey);
          if (recovered && recovered.version !== null) {
            setQuote({ ...result.quote, version: recovered.version });
            setForm(cachedForm(JSON.stringify(recovered.form), nextMeta));
            dirtyRef.current = true;
            setDirty(true);
            setRecoveredPending(true);
            setMessage("Đã khôi phục bản nháp trên tab này; hãy kiểm tra và bấm Lưu nháp.");
            try { writeDraft(localStorage, currentEditDraftKey(), { ...recovered, updatedAt: Date.now() }); }
            catch { setError("Không thể lưu bản nháp trên thiết bị. Hãy giữ trang mở khi chỉnh sửa."); }
          } else {
            setQuote(result.quote);
            setForm(quoteToForm(result.quote));
          }
        } else {
          const recovered = readDraft(sessionStorage, tabDraftKey);
          const candidates = user ? listEditDrafts(localStorage, user.id, "new") : [];
          const legacy = localStorage.getItem(draftKey);
          if (legacy && candidates.length) {
            try {
              const form: unknown = JSON.parse(legacy);
              if (form && typeof form === "object") candidates.push({ key: draftKey, raw: legacy, draft: { version: null, form, creationKey: localStorage.getItem(`${makeDraftKey(user?.id ?? "unknown")}:create-key`) ?? undefined } });
            } catch { /* Preserve unreadable legacy data without attempting recovery. */ }
          }
          setRecoverableDrafts(candidates);
          const raw = recovered ? JSON.stringify(recovered.form) : candidates.length ? null : legacy;
          if (raw && legacy === raw) legacySnapshotRef.current = legacy;
          if (raw) {
            const legacyKeyName = `${makeDraftKey(user?.id ?? "unknown")}:create-key`;
            const legacySessionKey = recovered && recovered.updatedAt === undefined ? sessionStorage.getItem(legacyKeyName) : null;
            const legacyLocalKey = legacy === raw ? localStorage.getItem(legacyKeyName) : null;
            creationKeyRef.current = recovered?.creationKey ?? legacySessionKey ?? legacyLocalKey ?? "";
            if (recovered?.quoteId && recovered.version !== null) {
              const result = await api<{ quote: QuoteRecord }>(`/api/quotes/${recovered.quoteId}`);
              setQuote({ ...result.quote, version: recovered.version });
            }
            try { writeDraft(localStorage, currentEditDraftKey(), { version: recovered?.version ?? null, quoteId: recovered?.quoteId, form: JSON.parse(raw) as unknown, creationKey: creationKeyRef.current || undefined, updatedAt: Date.now() }); }
            catch { setError("Không thể lưu bản nháp trên thiết bị. Hãy giữ trang mở khi chỉnh sửa."); }
          }
          setForm(cachedForm(raw, nextMeta));
          if (raw) {
            dirtyRef.current = true;
            setDirty(true);
            setMessage("Đã khôi phục bản nháp trên thiết bị; chưa lưu lên hệ thống.");
          }
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Không thể mở báo giá.");
      } finally {
        setLoading(false);
      }
    })();
  }, [draftKey, id, tabDraftKey, currentEditDraftKey, user]);

  useEffect(() => {
    const query = customerSearch.trim();
    if (query.length < 2) {
      setCustomerSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void api<{ customers: CustomerRecord[] }>(`/api/customers?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((result) => {
          setCustomerSuggestions(result.customers);
          setCustomerSuggestionsOpen(result.customers.length > 0);
        })
        .catch((caught) => {
          if (!(caught instanceof DOMException && caught.name === "AbortError")) setCustomerSuggestions([]);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [customerSearch]);

  const change = useCallback((next: QuoteForm) => {
    setForm(next);
    setDirty(true);
    dirtyRef.current = true;
    editRevisionRef.current += 1;
    setMessage("");
    const draft = { version: quoteRef.current?.version ?? null, quoteId: id ? undefined : quoteRef.current?.id, form: next, creationKey: id ? undefined : creationKeyRef.current || undefined, updatedAt: Date.now() };
    try { writeDraft(sessionStorage, tabDraftKey, draft); }
    catch { setError("Trình duyệt không thể lưu bản nháp trên tab này. Hãy giữ trang mở và lưu báo giá."); }
    try { writeDraft(localStorage, currentEditDraftKey(), draft); }
    catch { setError("Trình duyệt không thể lưu bản nháp trên thiết bị. Hãy giữ trang mở và lưu báo giá."); }
  }, [draftKey, id, tabDraftKey, currentEditDraftKey]);

  const save = useCallback((silent = false): Promise<QuoteRecord | null> => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const task = (async () => {
    setSaving(true);
      if (!silent) { setError(""); setErrorRequestId(""); }
      for (;;) {
        const current = formRef.current;
        if (!current) return quoteRef.current;
        const revision = editRevisionRef.current;
        const existing = quoteRef.current;
        let tabSnapshot: string | null = null;
        let editSnapshot: string | null = null;
        try {
          if (!existing && !creationKeyRef.current) {
            const key = crypto.randomUUID();
            const pendingDraft = { version: null, form: current, creationKey: key, updatedAt: Date.now() };
            writeDraft(localStorage, currentEditDraftKey(), pendingDraft);
            writeDraft(sessionStorage, tabDraftKey, pendingDraft);
            creationKeyRef.current = key;
          }
          try {
            tabSnapshot = sessionStorage.getItem(tabDraftKey);
            editSnapshot = localStorage.getItem(currentEditDraftKey());
          } catch { /* The form remains in memory if storage is unavailable. */ }
          const result = await apiWithTimeout<{ quote: QuoteRecord }>(existing ? `/api/quotes/${existing.id}` : "/api/quotes", {
            method: existing ? "PUT" : "POST",
            headers: existing ? undefined : { "Idempotency-Key": creationKeyRef.current },
            body: JSON.stringify(payload(current, existing?.version)),
          });
          quoteRef.current = result.quote;
          setQuote(result.quote);
          if (!id && editRevisionRef.current !== revision && formRef.current) {
            const pendingDraft = { version: result.quote.version, quoteId: result.quote.id, form: formRef.current, creationKey: creationKeyRef.current || undefined, updatedAt: Date.now() };
            try {
              writeDraft(localStorage, currentEditDraftKey(), pendingDraft);
              writeDraft(sessionStorage, tabDraftKey, pendingDraft);
            } catch { setError("Không thể lưu bản nháp trên thiết bị. Hãy giữ trang mở khi chỉnh sửa."); }
          }
          if (editRevisionRef.current === revision) {
            try {
              clearSavedDraft(sessionStorage, tabDraftKey, tabSnapshot);
              clearSavedDraft(localStorage, currentEditDraftKey(), editSnapshot);
              if (!id && legacySnapshotRef.current && localStorage.getItem(draftKey) === legacySnapshotRef.current) {
                clearSavedDraft(localStorage, draftKey, legacySnapshotRef.current);
                clearCreationKey(sessionStorage, user?.id ?? "unknown", creationKeyRef.current, localStorage);
              }
              creationKeyRef.current = "";
            } catch { /* A confirmed server save must not be reported as failed. */ }
            setForm(quoteToForm(result.quote));
            dirtyRef.current = false;
            setDirty(false);
            setRecoveredPending(false);
            setError("");
            setErrorRequestId("");
            setSessionProblem(false);
            setMessage(silent ? "Đã tự động lưu" : "Đã lưu báo giá");
            if (!id) void navigate(`/bao-gia/${result.quote.id}/chinh-sua`, { replace: true });
            return result.quote;
          }
        } catch (caught) {
          setErrorRequestId(caught instanceof ApiError ? caught.requestId ?? "" : "");
          if (caught instanceof ApiError && (caught.status === 401 || (caught.status === 403 && (caught.code === "CSRF_INVALID" || caught.message.includes("CSRF"))))) {
            setSessionProblem(true);
            setError("Phiên đăng nhập đã hết hạn hoặc thay đổi. Dữ liệu đang nhập vẫn được giữ trên trang; hãy đăng nhập lại và cập nhật phiên.");
          } else if (!(caught instanceof ApiError) || caught.status >= 500) {
            setError("Chưa xác nhận được kết quả lưu. Dữ liệu vẫn trên trang; hãy kiểm tra danh sách báo giá trước khi thử lại để tránh tạo trùng.");
          } else {
            setError(caught.message);
          }
          return null;
        }
      }
    })();
    const pending = task.finally(() => {
      savePromiseRef.current = null;
      setSaving(false);
    });
    savePromiseRef.current = pending;
    return pending;
  }, [draftKey, id, navigate, tabDraftKey, user?.id, currentEditDraftKey]);

  useEffect(() => {
    if (!id || !dirty || recoveredPending) return;
    const timer = window.setTimeout(() => { void save(true); }, 1800);
    return () => window.clearTimeout(timer);
  }, [dirty, id, save, form, recoveredPending]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Báo giá có thay đổi chưa lưu. Bạn có muốn rời trang?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  const calculation = useMemo(() => {
    if (!form) return { totals: null, error: "" };
    try { return { totals: calculateTotals(form.rows, form), error: "" }; }
    catch (caught) {
      const subtotal = form.rows.reduce((sum, row) => {
        try { return Math.min(Number.MAX_SAFE_INTEGER, sum + calculateLineTotal(row.quantity, row.unitPrice)); }
        catch { return sum; }
      }, 0);
      const taxableBase = Math.max(0, subtotal - form.discount + form.shippingFee + form.processingFee);
      const vatAmount = form.vatAmount;
      const grandTotal = Math.max(0, taxableBase + vatAmount);
      return {
        totals: { subtotal, discount: form.discount, shippingFee: form.shippingFee, processingFee: form.processingFee, vatAmount, grandTotal, depositAmount: form.depositAmount, remainingAmount: Math.max(0, grandTotal - form.depositAmount) },
        error: caught instanceof Error ? caught.message : "Số tiền không hợp lệ.",
      };
    }
  }, [form]);
  const totals = calculation.totals;

  const saveThen = async (action: "preview" | "pdf" | "print") => {
    const saved = dirty || !quote ? await save() : quote;
    if (!saved) return;
    if (action === "preview") void navigate(`/bao-gia/${saved.id}/xem-truoc`);
    if (action === "print") window.open(`/bao-gia/${saved.id}/xem-truoc?print=1`, "_blank", "noopener,noreferrer");
    if (action === "pdf") {
      setSaving(true);
      try {
        const result = await api<{ downloadUrl: string }>(`/api/quotes/${saved.id}/pdf`, { method: "POST" });
        await downloadProtected(result.downloadUrl, buildQuotePdfFilename(saved));
        const refreshed = await api<{ quote: QuoteRecord }>(`/api/quotes/${saved.id}`);
        quoteRef.current = refreshed.quote;
        setQuote(refreshed.quote);
        setMessage("Đã tạo và tải PDF");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Không thể xuất PDF.");
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) return <div className="page-loading"><span />Đang mở bảng báo giá…</div>;
  if (!form || !meta || !totals) return <div className="form-error">{error || "Không thể mở báo giá."}</div>;

  const moneyField = (key: "discount" | "shippingFee" | "processingFee" | "vatAmount" | "oldDebtAmount" | "depositAmount", label: string) => (
    <MoneyInput name={key} label={label} value={form[key]} onChange={(value) => change({ ...form, [key]: value })} />
  );
  const employeeContact = quote
    ? formatEmployeeContact(quote.employeeName, quote.employeePhone)
    : formatEmployeeContact(user?.fullName ?? "Tài khoản đang đăng nhập", user?.phone ?? "");
  const selectCustomer = (customer: CustomerRecord) => {
    change({ ...form, customerName: customer.name, customerPhone: customer.phone, customerAddress: customer.address });
    setCustomerSuggestionsOpen(false);
    setCustomerSearch("");
  };
  const restoreEditDraft = async (entry: ReturnType<typeof listEditDrafts>[number]) => {
    if (id && (!quoteRef.current || entry.draft.version === null)) return;
    if (dirtyRef.current && !window.confirm("Báo giá đang có thay đổi chưa lưu. Bạn muốn mở bản nháp khác?")) return;
    try {
      const revision = editRevisionRef.current;
      if (localStorage.getItem(entry.key) !== entry.raw) throw new Error("Bản nháp đã thay đổi. Hãy mở lại trang để xem phiên bản mới.");
      const next = cachedForm(JSON.stringify(entry.draft.form), meta);
      let previousQuote = id ? quoteRef.current : null;
      if (!id && entry.draft.version !== null) {
        if (!entry.draft.quoteId) throw new Error("Không xác định được báo giá đã tạo. Hãy kiểm tra danh sách báo giá.");
        previousQuote = (await api<{ quote: QuoteRecord }>(`/api/quotes/${entry.draft.quoteId}`)).quote;
      }
      if (revision !== editRevisionRef.current || localStorage.getItem(entry.key) !== entry.raw) throw new Error("Dữ liệu đã thay đổi. Hãy kiểm tra lại trước khi khôi phục.");
      if (previousQuote && entry.draft.version !== null) previousQuote = { ...previousQuote, version: entry.draft.version };
      const recovered = { version: entry.draft.version, quoteId: entry.draft.quoteId, creationKey: entry.draft.creationKey, form: next, updatedAt: Date.now() };
      writeDraft(localStorage, currentEditDraftKey(), recovered);
      writeDraft(sessionStorage, tabDraftKey, recovered);
      formRef.current = next;
      quoteRef.current = previousQuote;
      creationKeyRef.current = entry.draft.creationKey ?? "";
      legacySnapshotRef.current = entry.key === draftKey ? entry.raw : null;
      setForm(next);
      setQuote(previousQuote);
      editRevisionRef.current += 1;
      dirtyRef.current = true;
      setDirty(true);
      setRecoveredPending(true);
      setError("");
      setMessage("Đã khôi phục bản nháp trên thiết bị; hãy kiểm tra và bấm Lưu nháp.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể khôi phục bản nháp."); }
  };
  const discardEditDraft = (entry: ReturnType<typeof listEditDrafts>[number]) => {
    if (!user || !window.confirm("Xóa bản nháp trên thiết bị? Hãy kiểm tra nội dung trước khi xóa.")) return;
    try {
      if (localStorage.getItem(entry.key) !== entry.raw) throw new Error("Bản nháp đã thay đổi. Hãy mở lại trang trước khi xóa.");
      clearSavedDraft(localStorage, entry.key, entry.raw);
      setRecoverableDrafts((drafts) => drafts.filter((draft) => draft.key !== entry.key));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa bản nháp."); }
  };

  return (
    <div>
      <PageHeader title={quote ? `Chỉnh sửa ${quote.quoteNumber}` : "Tạo báo giá mới"} description="Nhập trực tiếp, dùng Tab/Enter/phím mũi tên hoặc dán nhiều ô từ Excel." actions={<div className="save-state"><Wifi size={15} />{saving ? "Đang lưu…" : message || (dirty ? "Có thay đổi chưa lưu" : quote ? "Đã lưu" : "Chưa lưu lên hệ thống")}</div>} />
      {(error || calculation.error) && <div className="form-error">{error || calculation.error}</div>}
      {error && errorRequestId && <p>Mã yêu cầu: {errorRequestId}</p>}
      {sessionProblem && <div className="form-section"><a href="/login" target="_blank" rel="noopener noreferrer">Đăng nhập lại trong tab mới</a>{" "}<button className="button secondary" type="button" onClick={() => void (async () => {
        try {
          if (!user) throw new Error("Không xác định được tài khoản ban đầu.");
          await refreshSessionForUser(user.id);
          setSessionProblem(false);
          setError("");
          setMessage("Đã cập nhật phiên. Hãy kiểm tra dữ liệu và lưu lại.");
        } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể cập nhật phiên."); }
      })()}>Cập nhật phiên đăng nhập</button></div>}
      {recoverableDrafts.length > 0 && <section className="form-section" aria-label="Bản nháp trên thiết bị">
        <strong>Bản nháp trên thiết bị</strong>
        <p>Những bản nháp này chưa được xác nhận lưu lên hệ thống và có thể được người khác dùng chung máy truy cập.</p>
        {recoverableDrafts.map((entry) => <div key={entry.key}>
          <span>{entry.draft.updatedAt ? new Date(entry.draft.updatedAt).toLocaleString("vi-VN") : "Không rõ thời gian"} · {entry.draft.version === null ? "báo giá mới" : `phiên bản ${entry.draft.version}`}{entry.draft.updatedAt && Date.now() - entry.draft.updatedAt > 30 * 24 * 60 * 60 * 1000 ? " · quá 30 ngày" : ""}</span>{" "}
          <button className="button secondary" type="button" onClick={() => void restoreEditDraft(entry)}>Khôi phục bản nháp</button>{" "}
          <button className="button ghost" type="button" onClick={() => discardEditDraft(entry)}>Xóa bản nháp</button>
        </div>)}
      </section>}
      <div className="editor-layout">
        <div className="editor-main">
          <section className="form-section quote-meta-grid">
            <label><span>Chi nhánh</span><select value={form.branchId} disabled={Boolean(quote)} onChange={(event) => change({ ...form, branchId: event.target.value })}>{meta.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}</select></label>
            <label><span>Ngày lập</span><input type="date" value={form.quoteDate} disabled={Boolean(quote)} onChange={(event) => change({ ...form, quoteDate: event.target.value })} /></label>
            <label><span>Nhân viên lập</span><input value={employeeContact} readOnly /></label>
          </section>
          <section className="form-section">
            <h2>Thông tin khách hàng</h2>
            <div className="customer-grid">
              <label className="customer-autocomplete"><span>Tên khách hàng</span><input value={form.customerName} autoComplete="off" onFocus={() => { setCustomerSearch(form.customerName); setCustomerSuggestionsOpen(customerSuggestions.length > 0); }} onBlur={() => window.setTimeout(() => setCustomerSuggestionsOpen(false), 120)} onChange={(event) => { change({ ...form, customerName: event.target.value }); setCustomerSearch(event.target.value); }} />{customerSuggestionsOpen && <div className="customer-suggestions" role="listbox" aria-label="Khách hàng đã lưu">{customerSuggestions.map((customer) => <button key={customer.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => selectCustomer(customer)}><strong>{customer.name || "Khách hàng chưa đặt tên"}</strong><span>{[customer.phone, customer.address].filter(Boolean).join(" · ") || "Chưa có thông tin liên hệ"}</span></button>)}</div>}</label>
              <label><span>Số điện thoại</span><input value={form.customerPhone} inputMode="tel" autoComplete="off" onFocus={() => { setCustomerSearch(form.customerPhone); setCustomerSuggestionsOpen(customerSuggestions.length > 0); }} onChange={(event) => { change({ ...form, customerPhone: event.target.value }); setCustomerSearch(event.target.value); }} /></label>
              <label className="wide"><span>Địa chỉ</span><input value={form.customerAddress} onChange={(event) => change({ ...form, customerAddress: event.target.value })} /></label>
            </div>
          </section>
          <section className="form-section grid-section"><div className="section-heading"><div><h2>Bảng sản phẩm</h2><p>Thành tiền được khóa và tự tính theo số lượng × đơn giá.</p></div></div><QuoteGrid rows={form.rows} onChange={(rows) => change({ ...form, rows })} /></section>
          <section className="form-section notes-grid">
            <label><span>Ghi chú giao hàng</span><textarea rows={4} value={form.deliveryNote} onChange={(event) => change({ ...form, deliveryNote: event.target.value })} /></label>
            <label><span>Ghi chú chung</span><textarea rows={4} value={form.generalNote} onChange={(event) => change({ ...form, generalNote: event.target.value })} /></label>
          </section>
        </div>
        <aside className="totals-panel">
          <div><h2>Tổng thanh toán</h2><span>{quote?.quoteNumber ?? "Mã được cấp khi lưu"}</span></div>
          <dl><div><dt>Tiền hàng</dt><dd>{formatVnd(totals.subtotal)}</dd></div></dl>
          {moneyField("discount", "Chiết khấu")}
          {moneyField("shippingFee", "Phí vận chuyển")}
          {moneyField("processingFee", "Phí gia công")}
          {moneyField("vatAmount", "Thuế VAT")}
          <dl className="grand-total"><div><dt>Tổng thanh toán</dt><dd>{formatVnd(totals.grandTotal)}</dd></div></dl>
          <div className="old-debt-editor">{moneyField("oldDebtAmount", "Nợ cũ")}<p>Khoản này không cộng vào tổng thanh toán.</p></div>
          {moneyField("depositAmount", "Số tiền đã nhận")}
          <PaymentActions
            paymentStatus={form.paymentStatus}
            receivedAmount={form.depositAmount}
            grandTotal={totals.grandTotal}
            disabled={saving}
            onChange={(paymentStatus, depositAmount) => change({ ...form, paymentStatus, depositAmount })}
          />
          <div className="remaining-total"><span>CÒN LẠI</span><strong>{formatVnd(totals.remainingAmount)}</strong>{totals.remainingAmount === 0 && totals.grandTotal > 0 && <em><Check size={15} /> Đã thanh toán đủ</em>}</div>
          <div className="editor-actions">
            <button className="button primary" type="button" disabled={saving} onClick={() => void save()}><Save size={17} /> Lưu nháp</button>
            <button className="button secondary" type="button" disabled={saving} onClick={() => void saveThen("preview")}><Eye size={17} /> Xem trước</button>
            <button className="button secondary" type="button" disabled={saving} onClick={() => void saveThen("pdf")}><FileDown size={17} /> Xuất PDF</button>
            <button className="button ghost" type="button" disabled={saving} onClick={() => void saveThen("print")}><Printer size={17} /> In báo giá</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
