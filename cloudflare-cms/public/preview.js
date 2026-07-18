/* global CMS, createClass, h */
// CMS preview intentionally renders content without website-only runtime code.
(function () {
  function mediaSource(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return "";
  }
  const Preview = createClass({
    render: function () {
      const entry = this.props.entry;
      const data = entry.get("data");
      const widgets = this.props.widgetFor("body");
      return h("main", { style: { fontFamily: "Arial, sans-serif", maxWidth: "860px", margin: "0 auto", padding: "32px", color: "#16211b" } },
        h("p", { style: { color: "#b84d00", fontWeight: 700, textTransform: "uppercase" } }, data.get("category") || data.get("eyebrow") || "Tùng Phát"),
        h("h1", { style: { fontSize: "42px", lineHeight: 1.15 } }, data.get("title") || "Chưa có tiêu đề"),
        h("p", { style: { fontSize: "18px", lineHeight: 1.7, color: "#52615a" } }, data.get("excerpt") || ""),
        mediaSource(data.get("featuredImage")) ? h("img", { src: mediaSource(data.get("featuredImage")), alt: data.get("featuredImageAlt") || "", style: { width: "100%", maxHeight: "480px", objectFit: "cover", margin: "24px 0" } }) : null,
        h("article", { style: { fontSize: "17px", lineHeight: 1.8 } }, widgets)
      );
    }
  });
  ["articles", "products", "projects", "pages"].forEach((collection) => CMS.registerPreviewTemplate(collection, Preview));
})();
