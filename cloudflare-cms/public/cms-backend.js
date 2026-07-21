/* global CMS, createClass, window */
(() => {
  "use strict";

  const SharedSessionAuth = createClass({
    componentDidMount() {
      const user = window.TPCMS?.decapUser();
      if (user) this.props.onLogin(user);
      else window.TPCMS?.requireLogin();
    },
    render() { return null; },
  });

  class TungPhatGateway {
    constructor(config, options) {
      const gateway = CMS.getBackend("git-gateway");
      if (!gateway) throw new Error("Không thể khởi tạo GitHub App gateway.");
      const backend = gateway.init({
        ...config,
        backend: { ...config.backend, name: "git-gateway", auth_type: "pkce" },
      }, options);
      const authenticate = backend.authenticate.bind(backend);
      const authenticateWithSession = () => {
        const user = window.TPCMS?.decapUser();
        return user ? authenticate(user) : Promise.reject(new Error("CMS session unavailable"));
      };
      backend.authenticate = authenticateWithSession;
      backend.restoreUser = authenticateWithSession;
      backend.status = async () => ({ auth: { status: true }, api: { status: true, statusPage: "" } });
      backend.getAuthClient = async () => ({
        currentUser: () => window.TPCMS?.decapUser() || null,
        logout: () => window.TPCMS?.logout(),
        clearStore() {},
      });
      backend.authComponent = () => SharedSessionAuth;
      backend.logout = () => window.TPCMS?.logout();
      return backend;
    }
  }

  CMS.registerBackend("tungphat-gateway", TungPhatGateway);
})();
