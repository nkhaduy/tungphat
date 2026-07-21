/* global window */
(() => {
  "use strict";
  window.CMS_MANUAL_INIT = true;
  const listeners = new Map();
  let currentUser = null;

  function emit(name, value) {
    for (const callback of listeners.get(name) || []) callback(value);
  }

  window.netlifyIdentity = {
    on(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    off(name, callback) {
      listeners.set(name, (listeners.get(name) || []).filter((item) => item !== callback));
    },
    init() { emit("init", currentUser); },
    currentUser() { return currentUser; },
    open() { window.TPCMS?.showLogin(); },
    close() {},
    logout() { return window.TPCMS?.logout(); },
    _setSession(user, csrf) {
      currentUser = user ? {
        id: user.username,
        email: `${user.username}@cms.local`,
        user_metadata: { full_name: user.username },
        app_metadata: { provider: "tungphat-session" },
        jwt: async () => csrf,
      } : null;
      emit(user ? "login" : "logout", currentUser);
    },
  };
})();
