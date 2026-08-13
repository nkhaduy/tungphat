/* global document, window, fetch, location */
(() => {
  "use strict";
  const panel = document.querySelector("#gbp-panel");
  const message = document.querySelector("#gbp-status-message");
  const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const number = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  async function load() {
    panel.setAttribute("aria-busy", "true");
    try {
      const response = await fetch("/api/admin/gbp/status", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (response.status === 401) return window.TPCMS?.requireLogin();
      const data = await response.json();
      const connection = data.connection;
      if (!connection?.location_name) {
        panel.innerHTML = `<div class="gbp-empty"><h2>Chưa kết nối Google Business Profile</h2><p>Kết nối tài khoản Google có quyền quản lý hồ sơ Tùng Phát để bắt đầu đồng bộ.</p><a class="action primary" href="/api/gbp/oauth/start">Kết nối Google</a></div>`;
        return;
      }
      const rows = (data.reviews?.latest || []).map((review) => `<article class="gbp-review"><strong>${esc(review.reviewer_display_name)}</strong><span class="gbp-stars" aria-label="${esc(review.rating)} trên 5 sao">${"★".repeat(Number(review.rating || 0))}${"☆".repeat(5 - Number(review.rating || 0))}</span><p>${esc(review.comment || "Không có nội dung")}</p></article>`).join("");
      const metricRows = (data.metrics || []).slice(0, 80).map((item) => `<tr><td>${esc(item.metric_date)}</td><td>${esc(item.metric_name)}</td><td>${number(item.metric_value)}</td></tr>`).join("");
      const keywordRows = (data.keywords || []).slice(0, 80).map((item) => `<tr><td>${esc(item.month)}</td><td>${esc(item.keyword)}</td><td>${item.impressions == null ? `≥ ${number(item.threshold)}` : number(item.impressions)}</td></tr>`).join("");
      panel.innerHTML = `<div class="gbp-overview"><div><span>Trạng thái</span><strong>${esc(connection.status)}</strong></div><div><span>Địa điểm</span><strong>${esc(connection.location_title)}</strong><small>${esc(connection.location_name)}</small></div><div><span>Đánh giá</span><strong>${number(data.reviews?.total)} · ${esc(data.reviews?.average || "—")}★</strong></div><div><span>Đồng bộ gần nhất</span><strong>${connection.last_sync_succeeded_at ? new Date(Number(connection.last_sync_succeeded_at) * 1000).toLocaleString("vi-VN") : "—"}</strong></div></div><div class="gbp-actions"><button class="action primary" id="gbp-sync-now" type="button">Đồng bộ ngay</button><span>Cache tối đa ${number(data.retentionDays)} ngày</span></div><section><h2>Đánh giá mới nhất</h2><div class="gbp-reviews">${rows || "<p>Chưa có đánh giá trong cửa sổ lưu trữ.</p>"}</div></section><section><h2>Hiệu suất GBP</h2><div class="table-scroll"><table><thead><tr><th>Ngày</th><th>Metric</th><th>Giá trị</th></tr></thead><tbody>${metricRows}</tbody></table></div></section><section><h2>Từ khóa tìm kiếm</h2><div class="table-scroll"><table><thead><tr><th>Tháng</th><th>Từ khóa</th><th>Lượt hiển thị</th></tr></thead><tbody>${keywordRows}</tbody></table></div></section>`;
      document.querySelector("#gbp-sync-now")?.addEventListener("click", async () => {
        const result = await fetch("/api/admin/gbp/sync", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": window.TPCMS?.csrf?.(), Origin: location.origin } });
        if (!result.ok) { message.hidden = false; message.textContent = "Đồng bộ chưa thành công. Kiểm tra kết nối Google và thử lại."; return; }
        await load();
      });
    } catch { message.hidden = false; message.textContent = "Không thể tải dữ liệu Google Business Profile."; }
    finally { panel.setAttribute("aria-busy", "false"); }
  }
  window.addEventListener("tpcms:gbp-ready", load);
})();
