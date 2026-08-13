/* global CMS, location, document, window, fetch, CustomEvent */
(() => {
  "use strict";
  const PREVIEW_ORIGIN = "https://mdftungphat.com";
  const collections = { articles: "Bài viết", products: "Sản phẩm", projects: "Dự án CNC", pages: "Trang dịch vụ CNC" };
  const state = { csrf: "", user: null, cmsInitialized: false, authenticated: false, view: "content", draft: null, previewTimer: 0 };
  const loginView = document.querySelector("#login-view");
  const adminApp = document.querySelector("#admin-app");
  const loginForm = document.querySelector("#login-form");
  const loginError = document.querySelector("#login-error");
  const submit = document.querySelector("#login-submit");
  const username = document.querySelector("#username");
  const password = document.querySelector("#password");
  const views = {
    content: document.querySelector("#content-view"),
    preview: document.querySelector("#preview-view"),
    analytics: document.querySelector("#analytics-view"),
    gbp: document.querySelector("#gbp-view"),
  };
  const previewFrame = document.querySelector("#preview-frame");

  function setLoginError(message = "") {
    loginError.textContent = message;
    loginError.hidden = !message;
    username.setAttribute("aria-invalid", message ? "true" : "false");
    password.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function requestedView() {
    const value = new URLSearchParams(location.search).get("view");
    return value === "analytics" || value === "preview" || value === "gbp" ? value : "content";
  }

  function publishedUrl(draft) {
    const slug = String(draft?.data?.slug || "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "";
    if (draft.collection === "articles") return `https://mdftungphat.com/bai-viet/${slug}/`;
    if (draft.collection === "projects") return `https://mdftungphat.com/du-an/${slug}/`;
    return `https://mdftungphat.com/${slug}/`;
  }

  function renderPreviewMeta() {
    const draft = state.draft;
    const title = String(draft?.data?.title || "").trim();
    document.querySelector("#preview-title").textContent = title || "Chưa có nội dung đang xem";
    document.querySelector("#preview-collection").textContent = draft ? collections[draft.collection] || draft.collection : "—";
    document.querySelector("#preview-status").textContent = draft ? (draft.data.draft === false ? "Đã publish · dữ liệu hiện tại trong editor" : "Bản nháp chưa publish") : "Mở một entry trong trình biên tập";
    const openPublished = document.querySelector("#open-published");
    const url = draft?.data?.draft === false ? publishedUrl(draft) : "";
    openPublished.hidden = !url;
    if (url) openPublished.href = url;
  }

  function postPreviewDraft() {
    if (!state.authenticated || !previewFrame.contentWindow) return;
    previewFrame.contentWindow.postMessage({ type: "tp-preview-init" }, PREVIEW_ORIGIN);
    if (!state.draft) return;
    previewFrame.contentWindow.postMessage({ type: "tp-preview-draft", payload: state.draft }, PREVIEW_ORIGIN);
  }

  function receiveDraft(payload) {
    if (!state.authenticated || !payload || typeof payload !== "object" || !collections[payload.collection] || !payload.data || typeof payload.data !== "object") return false;
    let serialized = "";
    try { serialized = JSON.stringify(payload); } catch { return false; }
    if (new TextEncoder().encode(serialized).byteLength > 512 * 1024) return false;
    state.draft = { collection: payload.collection, data: payload.data, updatedAt: Date.now() };
    renderPreviewMeta();
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(postPreviewDraft, 300);
    return true;
  }

  function setView(view) {
    if (!state.authenticated) return;
    state.view = view === "analytics" || view === "preview" || view === "gbp" ? view : "content";
    Object.entries(views).forEach(([name, element]) => { element.hidden = name !== state.view; });
    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === state.view;
      button.classList.toggle("active", active);
      button.toggleAttribute("aria-current", active);
      if (active) button.setAttribute("aria-current", "page");
    });
    if (state.view === "analytics") window.dispatchEvent(new CustomEvent("tpcms:analytics-ready"));
    if (state.view === "gbp") window.dispatchEvent(new CustomEvent("tpcms:gbp-ready"));
    if (state.view === "preview") {
      renderPreviewMeta();
      postPreviewDraft();
    }
  }

  function showLogin(message = "") {
    state.authenticated = false;
    state.csrf = "";
    state.user = null;
    state.draft = null;
    adminApp.hidden = true;
    loginView.hidden = false;
    setLoginError(message);
    password.value = "";
    username.focus();
  }

  function startCms() {
    if (state.cmsInitialized) return;
    state.cmsInitialized = true;
    CMS.init();
  }

  function showApp(session) {
    state.authenticated = true;
    state.csrf = session.csrf;
    state.user = session.user;
    loginView.hidden = true;
    adminApp.hidden = false;
    startCms();
    setView(requestedView());
  }

  async function session() {
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!response.ok) return showLogin();
      showApp(await response.json());
    } catch {
      showLogin("Không thể kết nối lúc này. Vui lòng thử lại.");
    }
  }

  async function login(event) {
    event.preventDefault();
    setLoginError();
    loginForm.setAttribute("aria-busy", "true");
    submit.disabled = true;
    submit.textContent = "Đang đăng nhập…";
    try {
      const csrfResponse = await fetch("/api/auth/csrf", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!csrfResponse.ok) throw new Error("unavailable");
      const loginCsrf = await csrfResponse.json();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-CSRF-Token": loginCsrf.csrf },
        body: JSON.stringify({ username: username.value, password: password.value, csrf: loginCsrf.csrf }),
      });
      password.value = "";
      if (!response.ok) {
        setLoginError("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }
      showApp(await response.json());
    } catch {
      password.value = "";
      setLoginError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
    } finally {
      loginForm.removeAttribute("aria-busy");
      submit.disabled = false;
      submit.textContent = "Đăng nhập";
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "X-CSRF-Token": state.csrf } });
    } finally {
      showLogin();
    }
  }

  function decapUser() {
    if (!state.authenticated || !state.user) return null;
    return {
      id: state.user.username,
      email: "cms@mdftungphat.com",
      user_metadata: { full_name: state.user.username },
      app_metadata: { provider: "tungphat-session" },
      jwt: async () => state.csrf,
    };
  }

  window.TPCMS = {
    csrf: () => state.csrf,
    decapUser,
    logout,
    receiveDraft,
    refreshPreview: postPreviewDraft,
    showLogin,
    requireLogin: () => showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
    setView,
  };

  loginForm.addEventListener("submit", login);
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelector("#logout-button").addEventListener("click", logout);
  document.querySelector("#back-to-editor").addEventListener("click", () => setView("content"));
  document.querySelector("#refresh-preview").addEventListener("click", postPreviewDraft);
  document.querySelectorAll("[data-preview-width]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#preview-stage").dataset.width = button.dataset.previewWidth;
    document.querySelectorAll("[data-preview-width]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }));
  previewFrame.addEventListener("load", postPreviewDraft);
  window.addEventListener("message", (event) => {
    if (event.origin === PREVIEW_ORIGIN && event.source === previewFrame.contentWindow && event.data?.type === "tp-preview-ready") postPreviewDraft();
  });
  session();
})();
