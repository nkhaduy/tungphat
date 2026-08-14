import { Check, Eye, FileDown, Printer, Save, Wifi } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { calculateLineTotal, calculateTotals, formatVnd } from "../../shared/calculations";
import { buildQuotePdfFilename, formatEmployeeContact } from "../../shared/display";
import type { AppSettings, CustomerRecord, PaymentStatus, QuoteRecord } from "../../shared/types";
import { api, downloadProtected } from "../api";
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

function payload(form: QuoteForm, version?: number) {
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
    items: form.rows.map((item) => ({
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

function parseVndInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

type MoneyInputProps = {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function MoneyInput({ name, label, value, onChange }: MoneyInputProps) {
  return (
    <label className="money-input">
      <span>{label}</span>
      <input name={name} inputMode="numeric" value={value || ""} onChange={(event) => onChange(parseVndInput(event.target.value))} />
      <small>đ</small>
    </label>
  );
}

export function QuoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `tp-new-quote-draft:${user?.id ?? "unknown"}`;
  const [form, setForm] = useState<QuoteForm | null>(null);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerRecord[]>([]);
  const [customerSuggestionsOpen, setCustomerSuggestionsOpen] = useState(false);
  const formRef = useRef<QuoteForm | null>(null);
  const quoteRef = useRef<QuoteRecord | null>(null);
  const dirtyRef = useRef(false);
  const editRevisionRef = useRef(0);
  const savePromiseRef = useRef<Promise<QuoteRecord | null> | null>(null);
  formRef.current = form;
  quoteRef.current = quote;

  useEffect(() => {
    void (async () => {
      try {
        const nextMeta = await api<Meta>("/api/meta");
        setMeta(nextMeta);
        if (id) {
          const result = await api<{ quote: QuoteRecord }>(`/api/quotes/${id}`);
          setQuote(result.quote);
          setForm(quoteToForm(result.quote));
        } else {
          localStorage.removeItem("tp-new-quote-draft");
          setForm(cachedForm(localStorage.getItem(draftKey), nextMeta));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Không thể mở báo giá.");
      } finally {
        setLoading(false);
      }
    })();
  }, [draftKey, id]);

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
    if (!id) {
      try { localStorage.setItem(draftKey, JSON.stringify(next)); }
      catch { setError("Trình duyệt không thể lưu bản nháp cục bộ. Hãy bấm Lưu nháp."); }
    }
  }, [draftKey, id]);

  const save = useCallback((silent = false): Promise<QuoteRecord | null> => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const task = (async () => {
    setSaving(true);
      if (!silent) setError("");
      for (;;) {
        const current = formRef.current;
        if (!current) return quoteRef.current;
        const revision = editRevisionRef.current;
        const existing = quoteRef.current;
        try {
          const result = await api<{ quote: QuoteRecord }>(existing ? `/api/quotes/${existing.id}` : "/api/quotes", {
            method: existing ? "PUT" : "POST",
            body: JSON.stringify(payload(current, existing?.version)),
          });
          quoteRef.current = result.quote;
          setQuote(result.quote);
          localStorage.removeItem(draftKey);
          if (!existing) void navigate(`/bao-gia/${result.quote.id}/chinh-sua`, { replace: true });
          if (editRevisionRef.current === revision) {
            setForm(quoteToForm(result.quote));
            dirtyRef.current = false;
            setDirty(false);
            setMessage(silent ? "Đã tự động lưu" : "Đã lưu báo giá");
            return result.quote;
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : silent ? "Tự động lưu thất bại." : "Không thể lưu báo giá.");
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
  }, [draftKey, navigate]);

  useEffect(() => {
    if (!id || !dirty) return;
    const timer = window.setTimeout(() => { void save(true); }, 1800);
    return () => window.clearTimeout(timer);
  }, [dirty, id, save, form]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

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

  return (
    <div>
      <PageHeader title={quote ? `Chỉnh sửa ${quote.quoteNumber}` : "Tạo báo giá mới"} description="Nhập trực tiếp, dùng Tab/Enter/phím mũi tên hoặc dán nhiều ô từ Excel." actions={<div className="save-state"><Wifi size={15} />{saving ? "Đang lưu…" : message || (dirty ? "Có thay đổi chưa lưu" : "Đã lưu")}</div>} />
      {(error || calculation.error) && <div className="form-error">{error || calculation.error}</div>}
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
