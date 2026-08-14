import { Archive, Copy, Edit3, FileDown, Printer, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { formatVnd } from "../../shared/calculations";
import { buildQuotePdfFilename, formatEmployeeContact } from "../../shared/display";
import type { AppSettings, QuoteRecord } from "../../shared/types";
import { buildVietQrUrl } from "../../shared/vietqr";
import { paymentReceivedLabel, shouldShowPaymentQr } from "../../shared/payment";
import { api, downloadProtected } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export function QuotePreviewPage({ admin = false }: { admin?: boolean }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [headerBranches, setHeaderBranches] = useState<Array<{ code: string; address: string }>>([]);
  const [versions, setVersions] = useState<Array<{ id: string; versionNumber: number; pdfSize: number; createdAt: string; createdByName: string; downloadUrl: string }>>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [quoteResult, meta, versionResult] = await Promise.all([
        api<{ quote: QuoteRecord }>(`/api/quotes/${id}`),
        api<{ settings: AppSettings; branches: Array<{ code: string; address: string }> }>("/api/meta"),
        api<{ versions: Array<{ id: string; versionNumber: number; pdfSize: number; createdAt: string; createdByName: string; downloadUrl: string }> }>(`/api/quotes/${id}/versions`),
      ]);
      setQuote(quoteResult.quote);
      setSettings(meta.settings);
      setHeaderBranches(meta.branches);
      setVersions(versionResult.versions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể mở báo giá.");
    }
  };
  useEffect(() => { void load(); }, [id]);
  useEffect(() => {
    if (quote && new URLSearchParams(location.search).get("print") === "1") window.setTimeout(() => window.print(), 250);
  }, [location.search, quote]);
  useEffect(() => {
    if (!deleteConfirmOpen && !archiveConfirmOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy) return;
      setDeleteConfirmOpen(false);
      setArchiveConfirmOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [archiveConfirmOpen, busy, deleteConfirmOpen]);

  const exportPdf = async () => {
    if (!quote) return;
    setBusy(true);
    try {
      const result = await api<{ downloadUrl: string }>(`/api/quotes/${quote.id}/pdf`, { method: "POST" });
      await downloadProtected(result.downloadUrl, buildQuotePdfFilename(quote));
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xuất PDF."); }
    finally { setBusy(false); }
  };

  const adminAction = async (action: "cancel" | "restore" | "duplicate") => {
    if (!quote) return;
    setBusy(true);
    try {
      const result = await api<{ quote: QuoteRecord }>(`/api/admin/quotes/${quote.id}/${action}`, { method: "POST" });
      if (action === "duplicate") void navigate(`/bao-gia/${result.quote.id}/chinh-sua`);
      else setQuote(result.quote);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Thao tác không thành công."); }
    finally { setBusy(false); }
  };

  const deleteQuote = async () => {
    if (!quote) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/quotes/${quote.id}`, { method: "DELETE" });
      void navigate("/admin/bao-gia", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể xóa báo giá.");
      setBusy(false);
    }
  };

  const archiveQuote = async () => {
    if (!quote) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/quotes/${quote.id}/archive`, { method: "POST" });
      void navigate("/bao-gia", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu trữ báo giá.");
      setBusy(false);
    }
  };

  if (error && !quote) return <div className="form-error">{error}</div>;
  if (!quote || !settings) return <div className="page-loading"><span />Đang dựng bản xem trước…</div>;
  const isPaid = quote.paymentStatus === "PAID";
  const qrUrl = shouldShowPaymentQr(quote.paymentStatus, quote.totals.remainingAmount) ? buildVietQrUrl(settings.bank, quote.totals.remainingAmount) : null;
  const employeeContact = formatEmployeeContact(quote.employeeName, quote.employeePhone);
  const cn1Address = headerBranches.find((branch) => branch.code === "TP14")?.address ?? "14 Tam Bình, Hiệp Bình, TP.HCM";
  const cn2Address = headerBranches.find((branch) => branch.code === "TP81")?.address ?? "81B Tam Bình, Hiệp Bình, TP.HCM";
  const showItemNotes = quote.items.some((item) => item.note.trim());
  return (
    <div>
      <div className="no-print">
        <PageHeader title={`Báo giá ${quote.quoteNumber}`} description="Bản xem trước nội bộ. File PDF chính thức được tạo và lưu phiên bản ở server." actions={<StatusBadge status={quote.status} paymentStatus={quote.paymentStatus} />} />
        {error && <div className="form-error">{error}</div>}
        <div className="preview-actions">
          {quote.status !== "CANCELLED" && <Link className="button secondary" to={`/bao-gia/${quote.id}/chinh-sua`}><Edit3 size={16} /> Chỉnh sửa</Link>}
          <button className="button primary" type="button" disabled={busy || quote.status === "CANCELLED"} onClick={() => void exportPdf()}><FileDown size={16} /> Xuất PDF</button>
          <button className="button secondary" type="button" onClick={() => window.print()}><Printer size={16} /> In</button>
          {!admin && user?.role === "EMPLOYEE" && <button className="button ghost" type="button" disabled={busy} onClick={() => setArchiveConfirmOpen(true)}><Archive size={16} /> Lưu trữ</button>}
          {admin && user?.role === "ADMIN" && <button className="button ghost" type="button" disabled={busy} onClick={() => void adminAction("duplicate")}><Copy size={16} /> Nhân bản</button>}
          {admin && user?.role === "ADMIN" && quote.status !== "CANCELLED" && <button className="button danger-text" type="button" disabled={busy} onClick={() => void adminAction("cancel")}><XCircle size={16} /> Hủy</button>}
          {admin && user?.role === "ADMIN" && quote.status === "CANCELLED" && <button className="button secondary" type="button" disabled={busy} onClick={() => void adminAction("restore")}><RotateCcw size={16} /> Khôi phục</button>}
          {admin && user?.role === "ADMIN" && <button className="button danger-text" type="button" disabled={busy} onClick={() => setDeleteConfirmOpen(true)}><Trash2 size={16} /> Xóa</button>}
        </div>
      </div>
      {archiveConfirmOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setArchiveConfirmOpen(false); }}>
        <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-quote-title" aria-describedby="archive-quote-description">
          <div className="confirm-dialog-icon"><Archive size={22} aria-hidden="true" /></div>
          <h2 id="archive-quote-title">Lưu trữ báo giá {quote.quoteNumber}?</h2>
          <p id="archive-quote-description">Báo giá sẽ biến mất khỏi danh sách của bạn. Các dòng sản phẩm, phiên bản PDF và lịch sử audit vẫn được giữ nguyên.</p>
          <div className="confirm-dialog-actions">
            <button className="button secondary" type="button" disabled={busy} autoFocus onClick={() => setArchiveConfirmOpen(false)}>Hủy</button>
            <button className="button primary" type="button" disabled={busy} onClick={() => void archiveQuote()}><Archive size={16} /> {busy ? "Đang lưu trữ…" : "Lưu trữ báo giá"}</button>
          </div>
        </section>
      </div>}
      {deleteConfirmOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDeleteConfirmOpen(false); }}>
        <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-quote-title" aria-describedby="delete-quote-description">
          <div className="confirm-dialog-icon"><Trash2 size={22} aria-hidden="true" /></div>
          <h2 id="delete-quote-title">Xóa báo giá {quote.quoteNumber}?</h2>
          <p id="delete-quote-description">Báo giá sẽ được ẩn khỏi danh sách mặc định. Các dòng sản phẩm, phiên bản PDF và lịch sử audit vẫn được giữ an toàn.</p>
          <div className="confirm-dialog-actions">
            <button className="button secondary" type="button" disabled={busy} autoFocus onClick={() => setDeleteConfirmOpen(false)}>Hủy</button>
            <button className="button danger" type="button" disabled={busy} onClick={() => void deleteQuote()}><Trash2 size={16} /> {busy ? "Đang xóa…" : "Xóa báo giá"}</button>
          </div>
        </section>
      </div>}
      <article className="quote-preview-sheet">
        <header className="preview-company"><div className="preview-company-logo"><img src="/api/settings/logo" alt="Logo Tùng Phát" /></div><div className="preview-company-details"><strong>{settings.company.name}</strong><span><b>CN1:</b> {cn1Address}</span><span><b>CN2:</b> {cn2Address}</span><span><b>SĐT:</b> {settings.company.headerContactName} - {settings.company.headerPhone}</span><span><b>Website:</b> {settings.company.website}</span></div></header>
        <h1>BẢNG BÁO GIÁ</h1>
        <div className="preview-meta"><span><b>Mã báo giá:</b> {quote.quoteNumber}</span><span><b>Ngày lập:</b> {quote.quoteDate.split("-").reverse().join("/")}</span><span><b>Chi nhánh:</b> {quote.branchName} ({quote.branchAddress})</span><span><b>Người lập:</b> {employeeContact}</span></div>
        <section className="preview-customer"><span><b>Khách hàng:</b> {quote.customerName || "—"}</span><span><b>Điện thoại:</b> {quote.customerPhone || "—"}</span><span><b>Địa chỉ:</b> {quote.customerAddress || "—"}</span></section>
        <div className={`preview-table-wrap ${showItemNotes ? "with-notes" : "without-notes"}`}><table className="preview-table"><thead><tr><th>STT</th><th>Tên sản phẩm</th><th>Quy cách</th><th>SL</th><th>ĐVT</th><th>Đơn giá</th><th>Thành tiền</th>{showItemNotes && <th>Ghi chú</th>}</tr></thead><tbody>{quote.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.productName}</td><td>{item.specification}</td><td className="money">{item.quantity.toLocaleString("vi-VN")}</td><td>{item.unit}</td><td className="money">{item.unitPrice.toLocaleString("vi-VN")}</td><td className="money">{item.lineTotal.toLocaleString("vi-VN")}</td>{showItemNotes && <td>{item.note}</td>}</tr>)}</tbody></table></div>
        <section className="preview-summary"><div className="preview-bank"><h2>Thông tin chuyển khoản</h2><div className="preview-bank-details"><span><b>Ngân hàng:</b> <strong>{settings.bank.bankCode}</strong></span><span><b>Số tài khoản:</b> <strong>{settings.bank.accountNumber}</strong></span><span><b>Chủ tài khoản:</b> <strong>{settings.bank.holder}</strong></span></div>{qrUrl && !qrFailed ? <img src={qrUrl} onError={() => setQrFailed(true)} alt={`VietQR thanh toán ${formatVnd(quote.totals.remainingAmount)}`} /> : isPaid ? <strong className="paid-text">ĐÃ THANH TOÁN ĐỦ</strong> : qrUrl ? <strong className="qr-error">Không tải được VietQR. PDF sẽ không được phát hành nếu QR không hợp lệ.</strong> : <strong className="zero-payment">KHÔNG PHÁT SINH THANH TOÁN</strong>}</div><dl><div><dt>Tiền hàng</dt><dd>{formatVnd(quote.totals.subtotal)}</dd></div><div><dt>Chiết khấu</dt><dd>{quote.totals.discount > 0 ? `-${formatVnd(quote.totals.discount)}` : formatVnd(0)}</dd></div><div><dt>Phí vận chuyển</dt><dd>{formatVnd(quote.totals.shippingFee)}</dd></div><div><dt>Phí gia công</dt><dd>{formatVnd(quote.totals.processingFee)}</dd></div><div><dt>Thuế VAT</dt><dd>{formatVnd(quote.totals.vatAmount)}</dd></div><div className="preview-grand"><dt>TỔNG THANH TOÁN</dt><dd>{formatVnd(quote.totals.grandTotal)}</dd></div><div><dt>{paymentReceivedLabel(quote.paymentStatus)}</dt><dd>{formatVnd(quote.totals.depositAmount)}</dd></div><div className="preview-remaining"><dt>CÒN LẠI</dt><dd>{formatVnd(quote.totals.remainingAmount)}</dd></div></dl></section>
        {(quote.deliveryNote || quote.generalNote) && <section className="preview-notes"><h2>Ghi chú</h2>{quote.deliveryNote && <p>{quote.deliveryNote}</p>}{quote.generalNote && <p>{quote.generalNote}</p>}</section>}
      </article>
      <section className="version-history no-print">
        <h2>Lịch sử PDF</h2>
        {versions.length === 0 ? <p>Chưa có phiên bản PDF nào được phát hành.</p> : versions.map((version) => (
          <div key={version.id}><span><strong>Phiên bản {version.versionNumber}</strong>{new Date(version.createdAt).toLocaleString("vi-VN")} · {version.createdByName} · {Math.ceil(version.pdfSize / 1024)} KB</span><button className="button secondary" type="button" onClick={() => void downloadProtected(version.downloadUrl, buildQuotePdfFilename(quote))}><FileDown size={15} /> Tải PDF</button></div>
        ))}
      </section>
    </div>
  );
}
