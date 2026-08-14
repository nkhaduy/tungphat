import { FilePlus2, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatVnd } from "../../shared/calculations";
import { formatEmployeeContact } from "../../shared/display";
import type { QuoteRecord } from "../../shared/types";
import { api } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

type FilterState = { from: string; to: string; quoteNumber: string; customerName: string; customerPhone: string; status: string; paymentStatus: string; employeeId: string; branchId: string };
const initialFilters: FilterState = { from: "", to: "", quoteNumber: "", customerName: "", customerPhone: "", status: "", paymentStatus: "", employeeId: "", branchId: "" };

export function QuoteListPage({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ branches: Array<{ id: string; name: string }>; users: Array<{ id: string; fullName: string }> }>({ branches: [], users: [] });

  const load = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(Object.entries(activeFilters).filter(([, value]) => value));
      const result = await api<{ quotes: QuoteRecord[] }>(`/api/quotes?${params.toString()}`);
      setQuotes(result.quotes);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải báo giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(initialFilters);
    void api<{ branches: Array<{ id: string; name: string }> }>("/api/meta").then(async (result) => {
      const users = admin ? (await api<{ users: Array<{ id: string; fullName: string }> }>("/api/admin/users")).users : [];
      setMeta({ branches: result.branches, users });
    });
  }, [admin]);

  const submit = (event: FormEvent) => { event.preventDefault(); void load(); };
  const detailBase = admin ? "/admin/bao-gia" : "/bao-gia";

  return (
    <div>
      <PageHeader
        title={admin ? "Tất cả báo giá" : "Báo giá của tôi"}
        description={admin ? "Tra cứu theo nhân viên, chi nhánh, khách hàng và trạng thái." : "Theo dõi báo giá nháp, đã phát hành và thanh toán."}
        actions={<Link className="button primary" to="/bao-gia/moi"><FilePlus2 size={17} /> Tạo báo giá</Link>}
      />
      <form className="filter-bar" onSubmit={submit}>
        <label><span>Từ ngày</span><input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label><span>Đến ngày</span><input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <label><span>Mã báo giá</span><input value={filters.quoteNumber} onChange={(event) => setFilters({ ...filters, quoteNumber: event.target.value })} placeholder="TP81-…" /></label>
        <label><span>Khách hàng</span><input value={filters.customerName} onChange={(event) => setFilters({ ...filters, customerName: event.target.value })} /></label>
        <label><span>Số điện thoại</span><input value={filters.customerPhone} onChange={(event) => setFilters({ ...filters, customerPhone: event.target.value })} /></label>
        <label><span>Trạng thái thanh toán</span><select value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })}><option value="">Tất cả</option><option value="UNPAID">Cần xử lý</option><option value="DEPOSITED">Đã cọc</option><option value="PARTIAL">Thanh toán một phần</option><option value="PAID">Đã thanh toán</option></select></label>
        {admin && <label><span>Nhân viên</span><select value={filters.employeeId} onChange={(event) => setFilters({ ...filters, employeeId: event.target.value })}><option value="">Tất cả</option>{meta.users.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>}
        {admin && <label><span>Chi nhánh</span><select value={filters.branchId} onChange={(event) => setFilters({ ...filters, branchId: event.target.value })}><option value="">Tất cả</option>{meta.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        <button className="button secondary filter-submit" type="submit"><Search size={16} /> Lọc</button>
      </form>
      {error && <div className="form-error">{error}</div>}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Mã báo giá</th><th>Ngày</th><th>Khách hàng</th><th>Số điện thoại</th>{admin && <th>Nhân viên</th>}<th>Chi nhánh</th><th>Tổng tiền</th><th>Đã nhận</th><th>Còn lại</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }, (_, index) => <tr key={index} className="skeleton-row"><td colSpan={admin ? 10 : 9}><span /></td></tr>) : quotes.map((quote) => (
              <tr key={quote.id}>
                <td><Link className="quote-link" to={`${detailBase}/${quote.id}`}>{quote.quoteNumber}</Link></td>
                <td>{quote.quoteDate}</td>
                <td>{quote.customerName || "—"}</td>
                <td>{quote.customerPhone || "—"}</td>
                {admin && <td>{formatEmployeeContact(quote.employeeName, quote.employeePhone)}</td>}
                <td>{quote.branchName}</td>
                <td className="money">{formatVnd(quote.totals.grandTotal)}</td>
                <td className="money">{formatVnd(quote.totals.depositAmount)}</td>
                <td className="money remaining">{formatVnd(quote.totals.remainingAmount)}</td>
                <td><StatusBadge status={quote.status} paymentStatus={quote.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && quotes.length === 0 && <div className="empty-state"><FilePlus2 size={28} /><strong>Chưa có báo giá phù hợp</strong><span>{user?.role === "ADMIN" ? "Thử thay đổi bộ lọc." : "Tạo báo giá đầu tiên để bắt đầu."}</span></div>}
      </div>
    </div>
  );
}
