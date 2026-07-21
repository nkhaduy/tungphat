/* global CMS, history, location, document, window, fetch */
(() => {
  "use strict";
  const state = { csrf: "", cmsInitialized: false, authenticated: false, view: "content" };
  const loginView = document.querySelector("#login-view");
  const adminApp = document.querySelector("#admin-app");
  const loginForm = document.querySelector("#login-form");
  const loginError = document.querySelector("#login-error");
  const submit = document.querySelector("#login-submit");
  const username = document.querySelector("#username");
  const password = document.querySelector("#password");
  const passwordToggle = document.querySelector("#password-toggle");
  const contentView = document.querySelector("#content-view");
  const analyticsView = document.querySelector("#analytics-view");

  function setLoginError(message = "") {
    loginError.textContent = message;
    loginError.hidden = !message;
    username.setAttribute("aria-invalid", message ? "true" : "false");
    password.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function setPasswordVisible(visible) {
    password.type = visible ? "text" : "password";
    passwordToggle.textContent = visible ? "Ẩn" : "Hiện";
    passwordToggle.setAttribute("aria-pressed", String(visible));
    passwordToggle.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiển thị mật khẩu");
  }

  function requestedView() {
    return new URLSearchParams(location.search).get("view") === "analytics" ? "analytics" : "content";
  }

  function setView(view, replace = false) {
    if (!state.authenticated) return;
    state.view = view === "analytics" ? "analytics" : "content";
    const analytics = state.view === "analytics";
    contentView.hidden = analytics;
    analyticsView.hidden = !analytics;
    document.querySelector("#content-tab").classList.toggle("active", !analytics);
    document.querySelector("#analytics-tab").classList.toggle("active", analytics);
    document.querySelector("#content-tab").toggleAttribute("aria-current", !analytics);
    document.querySelector("#analytics-tab").toggleAttribute("aria-current", analytics);
    if (!analytics) document.querySelector("#content-tab").setAttribute("aria-current", "page");
    if (analytics) document.querySelector("#analytics-tab").setAttribute("aria-current", "page");
    const target = analytics ? "/?view=analytics" : "/?view=content";
    history[replace ? "replaceState" : "pushState"]({ view: state.view }, "", target);
    if (analytics) window.dispatchEvent(new CustomEvent("tpcms:analytics-ready"));
  }

  function showLogin(message = "") {
    state.authenticated = false;
    state.csrf = "";
    window.netlifyIdentity._setSession(null, "");
    adminApp.hidden = true;
    loginView.hidden = false;
    setLoginError(message);
    password.value = "";
    setPasswordVisible(false);
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
    window.netlifyIdentity._setSession(session.user, session.csrf);
    loginView.hidden = true;
    adminApp.hidden = false;
    startCms();
    setView(requestedView(), true);
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
        body: JSON.stringify({
          username: username.value,
          password: password.value,
          csrf: loginCsrf.csrf,
        }),
      });
      password.value = "";
      if (!response.ok) {
        setLoginError("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }
      showApp(await response.json());
    } catch {
      setLoginError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
    } finally {
      loginForm.removeAttribute("aria-busy");
      submit.disabled = false;
      submit.textContent = "Đăng nhập";
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-CSRF-Token": state.csrf },
      });
    } finally {
      history.replaceState({}, "", "/");
      showLogin();
    }
  }

  window.TPCMS = {
    csrf: () => state.csrf,
    logout,
    showLogin,
    requireLogin: () => showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
    setView,
  };
  passwordToggle.addEventListener("click", () => setPasswordVisible(password.type === "password"));
  loginForm.addEventListener("submit", login);
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelector("#logout-button").addEventListener("click", logout);
  window.addEventListener("popstate", () => setView(requestedView(), true));
  session();
})();
