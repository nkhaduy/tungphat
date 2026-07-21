/* global CMS, createClass, h, window */
(() => {
  "use strict";
  const PREVIEW_ORIGIN = "https://mdftungphat.com";

  const Preview = createClass({
    getInitialState() { return { ready: false }; },
    componentDidMount() {
      this.onMessage = (event) => {
        if (event.origin !== PREVIEW_ORIGIN || event.source !== this.frame?.contentWindow || event.data?.type !== "tp-preview-ready") return;
        this.setState({ ready: true }, this.publishDraft);
      };
      window.addEventListener("message", this.onMessage);
      this.publishDraft();
    },
    componentDidUpdate() { this.publishDraft(); },
    componentWillUnmount() { window.removeEventListener("message", this.onMessage); },
    initializeFrame() {
      this.frame?.contentWindow?.postMessage({ type: "tp-preview-init" }, PREVIEW_ORIGIN);
    },
    draft() {
      const entry = this.props.entry;
      const collection = this.props.collection?.get?.("name") || entry.getIn?.(["collection", "name"]) || entry.get?.("collection");
      return { collection: String(collection || ""), data: entry.get("data")?.toJS?.() || {}, updatedAt: Date.now() };
    },
    publishDraft() {
      const draft = this.draft();
      window.TPCMS?.receiveDraft(draft);
      if (this.state.ready && this.frame?.contentWindow) this.frame.contentWindow.postMessage({ type: "tp-preview-draft", payload: draft }, PREVIEW_ORIGIN);
    },
    render() {
      return h("iframe", {
        ref: (node) => { this.frame = node; },
        src: `${PREVIEW_ORIGIN}/cms-preview/`,
        title: "Bản xem trước website Tùng Phát",
        sandbox: "allow-scripts allow-same-origin",
        referrerPolicy: "strict-origin",
        onLoad: this.initializeFrame,
        style: { width: "100%", minHeight: "100vh", border: 0, background: "#fff" },
      });
    },
  });

  ["articles", "products", "projects", "pages"].forEach((collection) => CMS.registerPreviewTemplate(collection, Preview));
})();
