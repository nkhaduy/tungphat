/* global document, fetch, location, URLSearchParams, window */
(() => {
  "use strict";
  const panel = document.querySelector("#panel");
  const message = document.querySelector("#status-message");
  const freshness = document.querySelector("#freshness");
  const rangeStatus = document.querySelector("#range-status");
  const optOutWarning = document.querySelector("#optout-warning");
  const dialog = document.querySelector("#detail-dialog");
  const detail = document.querySelector("#detail-content");
  if (!panel || !message || !freshness || !rangeStatus || !optOutWarning || !dialog || !detail) return;
  let initialized = false;
  const state = { tab: "overview", from: vietnamDate(), to: vietnamDate() };
  const eventLabels = {
    page_view: "Mở trang", article_view: "Mở bài viết", article_engaged: "Đọc bài thực sự",
    product_view: "Xem sản phẩm", scroll_depth: "Cuộn nội dung", engagement_time: "Thời gian tương tác",
    click_phone: "Bấm gọi", click_zalo: "Mở Zalo", click_email: "Bấm email", click_maps: "Nhấn chỉ đường",
    click_catalogue: "Mở catalogue", click_quote: "Bấm nhận báo giá", form_start: "Bắt đầu form",
    form_submit: "Gửi form thành công",
  };

  function vietnamDate(offset = 0) {
    return new Date(Date.now() + 7 * 3600000 + offset * 86400000).toISOString().slice(0, 10);
  }
  function rangeQuery(extra = {}) {
    return new URLSearchParams({ from: state.from, to: state.to, ...extra }).toString();
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function number(value, maximumFractionDigits = 0) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(Number(value || 0));
  }
  function percent(value) { return `${number(Number(value || 0) * 100, 1)}%`; }
  function timestamp(value) {
    if (!value) return "Chưa có";
    return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value) * 1000));
  }
  async function api(route, options) {
    const mutationHeaders = options?.method && options.method !== "GET"
      ? { "X-CSRF-Token": window.TPCMS?.csrf?.() || "" }
      : {};
    const response = await fetch(`/api/admin/analytics/${route}?${rangeQuery()}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json", ...mutationHeaders, ...(options?.headers || {}) },
      ...options,
    });
    if (response.status === 401) {
      window.TPCMS?.requireLogin?.();
      throw new Error("Phiên đăng nhập đã hết hạn.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.code || "Không thể tải dữ liệu.");
    return data;
  }
  function loading() {
    message.hidden = true;
    panel.setAttribute("aria-busy", "true");
    panel.innerHTML = '<div class="skeleton-grid" aria-hidden="true"><div></div><div></div><div></div><div></div></div>';
  }
  function empty(title = "Chưa có dữ liệu trong khoảng thời gian này.", description = "Dữ liệu sẽ xuất hiện sau khi website ghi nhận lượt truy cập hoặc hành động liên hệ.") {
    return `<div class="empty"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div>`;
  }
  function table(headers, rows, label = "Bảng dữ liệu") {
    if (!rows.length) return empty();
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(label)} — có thể cuộn ngang">
      <p class="scroll-hint" aria-hidden="true">Vuốt ngang để xem thêm cột</p>
      <table><thead><tr>${headers.map(item => `<th scope="col">${escapeHtml(item)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>
    </div>`;
  }
  function metric(label, value, delta, tooltip) {
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "";
    const sign = delta > 0 ? "+" : "";
    const explanation = tooltip || label;
    return `<article class="metric" title="${escapeHtml(explanation)}" aria-label="${escapeHtml(`${label}: ${value}. ${explanation}`)}"><p class="label">${escapeHtml(label)}</p><p class="value">${value}</p><span class="delta ${direction}">${sign}${number(delta, 1)}% so với kỳ trước</span></article>`;
  }
  function chart(rows) {
    if (!rows.length) return empty();
    const max = Math.max(1, ...rows.map(row => Number(row.pageviews || 0)));
    return `<div class="chart">${rows.map(row => `<div class="bar-wrap" title="${number(row.pageviews)} lượt xem"><div class="bar" style="height:${Math.max(2, Number(row.pageviews || 0) / max * 190)}px"></div><span>${escapeHtml(row.bucket)}</span></div>`).join("")}</div>`;
  }

  async function renderOverview() {
    const [overview, series, landing] = await Promise.all([api("overview"), api("timeseries"), api("landing-pages")]);
    const m = overview.metrics, c = overview.comparison;
    panel.innerHTML = `<div class="metric-grid">
      ${metric("Người truy cập", number(m.visitors), c.visitors, "Số mã khách ẩn danh riêng biệt trong kỳ.")}
      ${metric("Phiên truy cập", number(m.sessions), c.sessions, "Phiên kết thúc sau 30 phút không hoạt động.")}
      ${metric("Lượt xem trang", number(m.pageviews), c.pageviews)}
      ${metric("Lượt mở Zalo", number(m.zalo), c.zalo, "Website biết người dùng đã mở Zalo, không biết họ có gửi tin nhắn.")}
      ${metric("Lượt nhấn chỉ đường", number(m.maps), c.maps, "Lượt mở chỉ đường đến địa điểm Tùng Phát.")}
      ${metric("Lượt bấm gọi", number(m.phone), c.phone, "Website biết người dùng đã bấm link gọi, không biết cuộc gọi có hoàn tất.")}
      ${metric("Khách tiềm năng", number(m.leads), c.leads, "Số phiên riêng biệt có ít nhất một hành động liên hệ.")}
      ${metric("Tỷ lệ chuyển đổi", percent(m.conversionRate), c.conversionRate, "Khách tiềm năng chia cho tổng số phiên.")}
    </div>
    <p class="note">${escapeHtml(overview.activeDefinition)}: <strong>${number(m.active)}</strong></p>
    <div class="grid-2"><section class="panel"><h2>Lưu lượng theo ${series.granularity === "hour" ? "giờ" : "ngày"}</h2>${chart(series.rows)}</section>
    <section class="panel"><h2>Trang đích hiệu quả</h2>${table(["Trang","Phiên","Khách tiềm năng"], landing.rows.slice(0,8).map(row => `<tr><td>${escapeHtml(row.title || row.path)}</td><td>${number(row.sessions)}</td><td>${number(row.leads)}</td></tr>`))}</section></div>`;
    freshness.textContent = `Cập nhật ${timestamp(overview.updatedAt)} · Múi giờ Asia/Ho_Chi_Minh`;
  }
  async function renderSources() {
    const data = await api("sources");
    panel.innerHTML = `<section class="panel"><h2>Nguồn truy cập</h2><p class="note">Nguồn được ghi nhận khi khách bắt đầu phiên truy cập; thông tin UTM được ưu tiên khi có.</p>
      ${table(["Nguồn / phương tiện","Người truy cập","Phiên","Lượt xem","Phiên tương tác","Mở Zalo","Chỉ đường","Bấm gọi","Khách tiềm năng","Tỷ lệ"], data.rows.map(row => `<tr><td>${escapeHtml(row.source)} / ${escapeHtml(row.medium)}</td><td>${number(row.visitors)}</td><td>${number(row.sessions)}</td><td>${number(row.pageviews)}</td><td>${number(row.engaged_sessions)}</td><td>${number(row.zalo)}</td><td>${number(row.maps)}</td><td>${number(row.phone)}</td><td>${number(row.leads)}</td><td>${percent(Number(row.leads || 0) / Math.max(1, Number(row.sessions || 0)))}</td></tr>`), "Nguồn truy cập")}</section>`;
  }
  async function renderSeo() {
    const [queries, queryPages, pages] = await Promise.all([api("search-console/queries"), api("search-console/query-pages"), api("search-console/pages")]);
    const rows = queries.rows || [];
    const totals = rows.reduce((acc, row) => ({ clicks: acc.clicks + Number(row.clicks || 0), impressions: acc.impressions + Number(row.impressions || 0) }), { clicks: 0, impressions: 0 });
    panel.innerHTML = `<div class="metric-grid">
      ${metric("Lượt nhấp Google", number(totals.clicks), 0)}${metric("Lượt hiển thị", number(totals.impressions), 0)}
      ${metric("CTR", percent(totals.impressions ? totals.clicks / totals.impressions : 0), 0)}
      ${metric("Trạng thái Search Console", queries.status === "connected" ? "Đã kết nối" : queries.status === "error" ? "Lỗi" : "Chưa cấu hình", 0)}
    </div>
    <section class="panel spaced"><h2>Từ khóa</h2>${table(["Từ khóa","Lượt nhấp","Hiển thị","CTR","Vị trí"], rows.map(row => `<tr><td>${escapeHtml(row.keys?.[0] || "(không xác định)")}</td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${percent(row.ctr)}</td><td>${number(row.position,1)}</td></tr>`), "Từ khóa")}</section>
    <section class="panel spaced"><h2>Từ khóa và trang đích</h2>${table(["Từ khóa","Trang đích","Lượt nhấp","Hiển thị","CTR","Vị trí"], (queryPages.rows || []).map(row => `<tr><td>${escapeHtml(row.keys?.[0])}</td><td>${escapeHtml(row.keys?.[1])}</td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${percent(row.ctr)}</td><td>${number(row.position,1)}</td></tr>`), "Từ khóa và trang đích")}</section>
    <section class="panel spaced"><h2>Trang đích SEO</h2>${table(["Trang","Lượt nhấp","Hiển thị","CTR","Vị trí"], (pages.rows || []).map(row => `<tr><td>${escapeHtml(row.keys?.[0])}</td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${percent(row.ctr)}</td><td>${number(row.position,1)}</td></tr>`), "Trang đích SEO")}</section>
    <section class="panel spaced"><p class="note"><strong>Giới hạn dữ liệu:</strong> Dữ liệu từ khóa Google được Search Console tổng hợp và có độ trễ. Google không cung cấp từ khóa tìm kiếm tự nhiên ở cấp độ từng khách truy cập. Chỉ số chuyển đổi được đối chiếu theo nguồn truy cập và trang đích, không phải theo danh tính từng người.</p></section>`;
    freshness.textContent = queries.lastSync ? `Search Console đồng bộ ${timestamp(queries.lastSync)}` : "Search Console chưa có dữ liệu đồng bộ";
  }
  async function renderContent() {
    const data = await api("content");
    panel.innerHTML = `<section class="panel"><h2>Hiệu quả nội dung</h2><p class="note">${escapeHtml(data.assistedDefinition)}</p>${table(
      ["Nội dung","Loại","Lượt xem","Người đọc","Đọc thực sự","Đọc gần hết","Tương tác TB","Mở Zalo sau xem","Bấm gọi sau xem","Hỗ trợ chuyển đổi"],
      data.rows.map(row => `<tr><td>${escapeHtml(row.title || row.content_id)}</td><td>${escapeHtml(row.type)}</td><td>${number(row.views)}</td><td>${number(row.readers)}</td><td>${number(row.engaged)}</td><td>${number(row.near_complete)}</td><td>${number(row.avg_engagement_seconds,1)} giây</td><td>${number(row.assisted_zalo)}</td><td>${number(row.assisted_phone)}</td><td>${number(row.assisted_conversions)}</td></tr>`)
    )}</section>`;
  }
  async function renderConversions() {
    const data = await api("conversions");
    const rows = data.rows || [];
    const total = rows.reduce((sum, row) => sum + Number(row.events || 0), 0);
    const zalo = rows.filter(row => row.event_name === "click_zalo").reduce((sum,row)=>sum+Number(row.events||0),0);
    const phone = rows.filter(row => row.event_name === "click_phone").reduce((sum,row)=>sum+Number(row.events||0),0);
    const maps = rows.filter(row => row.event_name === "click_maps").reduce((sum,row)=>sum+Number(row.events||0),0);
    panel.innerHTML = `<div class="metric-grid">${metric("Tổng hành động",number(total),0)}${metric("Lượt mở Zalo",number(zalo),0)}${metric("Lượt nhấn chỉ đường",number(maps),0)}${metric("Lượt bấm gọi",number(phone),0)}${metric("Vị trí CTA",number(new Set(rows.map(row=>row.cta_location)).size),0)}</div>
      <section class="panel spaced"><h2>Chuyển đổi theo trang và vị trí CTA</h2>${table(["Hành động","Vị trí","Trang","Số lượt","Phiên","Người truy cập"], rows.map(row => `<tr><td>${escapeHtml(eventLabels[row.event_name] || row.event_name)}</td><td>${escapeHtml(row.cta_location)}</td><td>${escapeHtml(row.path)}</td><td>${number(row.events)}</td><td>${number(row.sessions)}</td><td>${number(row.visitors)}</td></tr>`), "Chuyển đổi theo trang và vị trí CTA")}</section>`;
  }
  async function renderJourneys() {
    const data = await api("journeys");
    panel.innerHTML = `<section class="panel"><h2>Hành trình phiên ẩn danh</h2><p class="note">Mã phiên được rút gọn. Không hiển thị IP, User-Agent đầy đủ, tên, email, số điện thoại hoặc nội dung form.</p>
      ${table(["Mã phiên","Bắt đầu","Hoạt động cuối","Thời lượng","Nguồn","Trang đích","Thiết bị","Số trang","Chuyển đổi"], data.rows.map(row => {
        const duration = Math.max(0, Number(row.last_activity_at) - Number(row.started_at));
        return `<tr><td><button type="button" class="journey-link" data-session="${escapeHtml(row.session_id)}">${escapeHtml(row.session_id.slice(0,4).toUpperCase())}…${escapeHtml(row.session_id.slice(-4).toUpperCase())}</button></td><td>${timestamp(row.started_at)}</td><td>${timestamp(row.last_activity_at)}</td><td>${number(duration)} giây</td><td>${escapeHtml(row.source)} / ${escapeHtml(row.medium)}</td><td>${escapeHtml(row.landing_path)}</td><td>${escapeHtml(row.device_category)}</td><td>${number(row.pageviews)}</td><td>${Number(row.converted) ? "Có" : "Không"}</td></tr>`;
      }), "Hành trình phiên ẩn danh")}</section>`;
    panel.querySelectorAll(".journey-link[data-session]").forEach(button => button.addEventListener("click", () => showJourney(button.dataset.session)));
  }
  async function showJourney(sessionId) {
    const response = await fetch(`/api/admin/analytics/journeys/${encodeURIComponent(sessionId)}?${rangeQuery()}`, { credentials: "same-origin" });
    if (response.status === 401) {
      window.TPCMS?.requireLogin?.();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      message.textContent = "Không thể mở chi tiết hành trình này. Vui lòng thử lại.";
      message.hidden = false;
      return;
    }
    detail.innerHTML = `<h2>Phiên ${escapeHtml(sessionId.slice(0,4).toUpperCase())}…${escapeHtml(sessionId.slice(-4).toUpperCase())}</h2>
      <p class="note">${escapeHtml(data.session.source)} / ${escapeHtml(data.session.medium)} · ${escapeHtml(data.session.device_category)} · Trang đích ${escapeHtml(data.session.landing_path)}</p>
      <ol class="timeline">${data.events.map(event => `<li><strong>${timestamp(event.occurred_at)}</strong> — ${escapeHtml(eventLabels[event.event_name] || event.event_name)} ${event.path ? `· ${escapeHtml(event.path)}` : ""}${event.scroll_percent ? ` · ${number(event.scroll_percent)}%` : ""}${event.cta_location ? ` · ${escapeHtml(event.cta_location)}` : ""}</li>`).join("")}</ol>`;
    dialog.showModal();
  }
  function optOutStatus() { return document.cookie.split(";").some(item => item.trim() === "tp_analytics_opt_out=1"); }
  function updateOptOutWarning() {
    optOutWarning.hidden = !optOutStatus();
  }
  function setOptOut(enabled) {
    const domain = location.hostname.endsWith("mdftungphat.com") ? "; Domain=mdftungphat.com" : "";
    document.cookie = `tp_analytics_opt_out=${enabled ? "1" : ""}; Path=/; Max-Age=${enabled ? 31536000 : 0}; SameSite=Lax; Secure${domain}`;
    if (!enabled) document.cookie = "tp_analytics_opt_out=; Path=/; Max-Age=0; SameSite=Lax; Secure";
    updateOptOutWarning();
    if (state.tab === "settings") renderSettings();
  }
  async function renderSettings() {
    const data = await api("status");
    panel.innerHTML = `<div class="grid-2"><section class="panel"><h2>Trạng thái kết nối</h2><div class="settings-list">
      ${setting("Theo dõi website", data.firstParty)}${setting("Lưu trữ dữ liệu", data.database)}${setting("Google Analytics 4", data.ga4)}${setting("Google Search Console", data.searchConsole)}
      <div class="settings-row"><span>Người dùng đang hoạt động trên GA4</span><strong>${data.ga4ActiveUsers == null ? "Chưa có" : number(data.ga4ActiveUsers)}</strong></div>
      <div class="settings-row"><span>Sự kiện gần nhất</span><strong>${timestamp(data.latestEvent)}</strong></div>
      <div class="settings-row"><span>Thời gian lưu dữ liệu chi tiết</span><strong>${number(data.retention.rawDays)} ngày</strong></div>
      <div class="settings-row"><span>Theo dõi thiết bị hiện tại</span><strong>${optOutStatus() ? "Đang tắt" : "Đang bật"}</strong></div>
      </div></section><section class="panel"><h2>Thao tác</h2><div class="actions">
      <button type="button" class="action primary" id="refresh-data">Làm mới dữ liệu</button><button type="button" class="action" id="test-event">Ghi nhận thử</button>
      <button type="button" class="action" id="toggle-optout">${optOutStatus() ? "Bật lại theo dõi" : "Tắt theo dõi thiết bị này"}</button></div>
      <p class="note">Nên tắt theo dõi trên máy thường xuyên dùng để quản trị hoặc kiểm tra website. Dữ liệu ghi nhận thử được đánh dấu riêng và không xuất hiện trong báo cáo.</p></section></div>`;
    document.querySelector("#toggle-optout").onclick = () => setOptOut(!optOutStatus());
    document.querySelector("#refresh-data").onclick = () => postAction("refresh");
    document.querySelector("#test-event").onclick = () => postAction("test-event");
  }
  function setting(label, status) {
    const text = status === "connected" ? "Đã kết nối" : status === "configured" ? "Đã cấu hình" : status === "error" ? "Lỗi" : "Chưa cấu hình";
    return `<div class="settings-row"><span>${escapeHtml(label)}</span><span class="connection"><i class="dot ${escapeHtml(status)}"></i>${text}</span></div>`;
  }
  async function postAction(route) {
    try {
      await api(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      message.textContent = route === "test-event" ? "Đã ghi nhận thử. Dữ liệu này không xuất hiện trong báo cáo." : "Đã làm mới dữ liệu.";
      message.hidden = false;
      if (route === "refresh") renderSettings();
    } catch (error) { showError(error); }
  }
  function showError() {
    message.textContent = "Không thể tải báo cáo này. Dữ liệu website không bị ảnh hưởng.";
    message.hidden = false;
    panel.innerHTML = `<div class="empty error-state"><strong>Dữ liệu tạm thời chưa sẵn sàng.</strong><span>Vui lòng thử tải lại báo cáo.</span><button type="button" class="action" id="retry-panel">Thử lại</button></div>`;
    document.querySelector("#retry-panel").addEventListener("click", () => render());
  }
  async function render() {
    loading();
    rangeStatus.textContent = state.from === vietnamDate() && state.to === vietnamDate()
      ? "Dữ liệu hôm nay"
      : state.from === state.to ? `Dữ liệu ngày ${state.from}` : `Dữ liệu ${state.from} – ${state.to}`;
    freshness.textContent = "Đang cập nhật…";
    updateOptOutWarning();
    try {
      await ({ overview: renderOverview, sources: renderSources, seo: renderSeo, content: renderContent, conversions: renderConversions, journeys: renderJourneys, settings: renderSettings }[state.tab])();
      if (freshness.textContent === "Đang cập nhật…") freshness.textContent = "Dữ liệu đã cập nhật theo bộ lọc hiện tại.";
    } catch (error) { showError(error); }
    finally { panel.setAttribute("aria-busy", "false"); }
  }
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    state.tab = button.dataset.tab; render();
    panel.setAttribute("aria-labelledby", button.id);
  }));
  document.querySelector(".tabs").addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...document.querySelectorAll("[data-tab]")];
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  });
  document.querySelectorAll("[data-range]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-range]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    const value = button.dataset.range;
    document.querySelector("#custom-range").hidden = value !== "custom";
    if (value === "custom") return;
    if (value === "today") state.from = state.to = vietnamDate();
    else if (value === "yesterday") state.from = state.to = vietnamDate(-1);
    else { state.to = vietnamDate(); state.from = vietnamDate(-(Number(value) - 1)); }
    render();
  }));
  document.querySelector("#apply-range").addEventListener("click", () => {
    const from = document.querySelector("#date-from").value, to = document.querySelector("#date-to").value;
    if (!from || !to || from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 399) {
      message.textContent = "Khoảng ngày không hợp lệ hoặc dài hơn 400 ngày."; message.hidden = false; return;
    }
    state.from = from; state.to = to; render();
  });
  document.querySelector("#refresh-dashboard").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Đang làm mới…";
    try { await render(); }
    finally { button.disabled = false; button.textContent = "Làm mới"; }
  });
  document.querySelector("#reenable-tracking").addEventListener("click", () => setOptOut(false));
  document.querySelector(".dialog-close").onclick = () => dialog.close();
  function initialize() {
    if (initialized) return;
    initialized = true;
    render();
  }
  window.addEventListener("tpcms:analytics-ready", initialize);
})();
