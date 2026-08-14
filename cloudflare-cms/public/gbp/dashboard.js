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
      const connections = data.connections || [];
      if (!connections.some((connection) => connection.location_name)) {
        panel.innerHTML = `<div class="gbp-empty"><h2>Chưa kết nối Google Business Profile</h2><p>Kết nối tài khoản Google có quyền quản lý hồ sơ Tùng Phát để bắt đầu đồng bộ.</p><a class="action primary" href="/api/gbp/oauth/start">Kết nối Google</a></div>`;
        return;
      }
      const summaryByLocation = new Map((data.reviews?.summaries || []).map((item) => [item.location_name, item]));
      const overview = connections.map((connection) => {
        const summary = summaryByLocation.get(connection.location_name) || {};
        return `<div><span>${esc(String(connection.branch_key || "GBP").toUpperCase())} · ${esc(connection.status)}</span><strong>${esc(connection.location_title)}</strong><small>${number(summary.total)} đánh giá · ${esc(summary.average || "—")}★</small><small>${connection.last_sync_succeeded_at ? new Date(Number(connection.last_sync_succeeded_at) * 1000).toLocaleString("vi-VN") : "Chưa đồng bộ"}</small></div>`;
      }).join("");
      const titleByLocation = new Map(connections.map((connection) => [connection.location_name, connection.location_title]));
      const rows = (data.reviews?.latest || []).map((review) => `<article class="gbp-review"><small>${esc(titleByLocation.get(review.location_name) || review.location_name)}</small><strong>${esc(review.reviewer_display_name)}</strong><span class="gbp-stars" aria-label="${esc(review.rating)} trên 5 sao">${"★".repeat(Number(review.rating || 0))}${"☆".repeat(5 - Number(review.rating || 0))}</span><p>${esc(review.comment || "Chỉ đánh giá bằng sao")}</p></article>`).join("");
      const metricRows = (data.metrics || []).slice(0, 80).map((item) => `<tr><td>${esc(item.metric_date)}</td><td>${esc(item.metric_name)}</td><td>${number(item.metric_value)}</td></tr>`).join("");
      const keywordRows = (data.keywords || []).slice(0, 80).map((item) => `<tr><td>${esc(item.month)}</td><td>${esc(item.keyword)}</td><td>${item.impressions == null ? `≥ ${number(item.threshold)}` : number(item.impressions)}</td></tr>`).join("");
      panel.innerHTML = `<div class="gbp-overview">${overview}</div><div class="gbp-actions"><button class="action primary" id="gbp-sync-now" type="button">Đồng bộ cả hai chi nhánh</button><a class="action" href="/api/gbp/oauth/start">Kết nối lại Google</a><span>Cache tối đa ${number(data.retentionDays)} ngày</span></div><section><h2>Đánh giá ưu tiên theo nội dung</h2><div class="gbp-reviews">${rows || "<p>Chưa có đánh giá trong cửa sổ lưu trữ.</p>"}</div></section><section><h2>Hiệu suất GBP</h2><div class="table-scroll"><table><thead><tr><th>Ngày</th><th>Metric</th><th>Giá trị</th></tr></thead><tbody>${metricRows}</tbody></table></div></section><section><h2>Từ khóa tìm kiếm</h2><div class="table-scroll"><table><thead><tr><th>Tháng</th><th>Từ khóa</th><th>Lượt hiển thị</th></tr></thead><tbody>${keywordRows}</tbody></table></div></section>`;
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
