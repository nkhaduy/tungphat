/* global CMS */
// Client-side guard; the website build remains the final publishing gate.
(function () {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const imagePattern = /^\/[^\s]+\.(avif|webp|png|jpe?g)$/i;
  const guardedCollections = new Set(["articles", "products", "projects", "pages"]);
  const reservedRootSlugs = new Set(["admin", "api", "bao-gia", "bai-viet", "catalogue", "chinh-sach-bao-mat", "dieu-khoan-su-dung", "du-an", "lien-he", "san-pham"]);

  async function validateRootCollision(collection, slug) {
    if (collection !== "products" && collection !== "pages") return;
    if (reservedRootSlugs.has(slug)) throw new Error("Slug này được dành cho route hệ thống và không thể publish.");
    const opposite = collection === "products" ? "pages" : "products";
    const response = await fetch(`https://api.github.com/repos/nkhaduy/tungphat/contents/content/${opposite}?ref=main`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error("Chưa thể kiểm tra xung đột product/service. Vui lòng thử publish lại.");
    const entries = await response.json();
    if (Array.isArray(entries) && entries.some((item) => item && item.name === `${slug}.md`)) {
      throw new Error("Slug đang được dùng bởi product/service ở collection còn lại.");
    }
  }

  CMS.registerEventListener({
    name: "prePublish",
    handler: async ({ entry }) => {
      const data = entry.get("data");
      const collection = String(entry.get("collection") || "");
      if (!guardedCollections.has(collection)) return data;
      const title = String(data.get("title") || "").trim();
      const slug = String(data.get("slug") || "").trim();
      const description = String(data.get("seoDescription") || "").trim();
      const image = String(data.get("featuredImage") || "").trim();
      const alt = String(data.get("featuredImageAlt") || "").trim();
      const canonical = String(data.get("canonical") || "").trim();
      if (!title || !slug || !description) throw new Error("Không thể publish: title, slug và SEO description là bắt buộc.");
      if (!slugPattern.test(slug)) throw new Error("Slug chỉ được dùng chữ thường, số và dấu gạch ngang.");
      await validateRootCollision(collection, slug);
      if (description.length < 80 || description.length > 170) throw new Error("SEO description phải dài 80–170 ký tự.");
      const draft = data.get("draft") === true;
      const noindex = data.get("noindex") === true;
      const publishedAt = String(data.get("publishedAt") || "");
      const updatedAt = String(data.get("updatedAt") || "");
      if (image && !imagePattern.test(image)) throw new Error("Ảnh đại diện phải là AVIF, WebP, PNG hoặc JPEG trong thư mục upload.");
      if (image && alt.length < 10) throw new Error("Alt text ảnh đại diện phải có ít nhất 10 ký tự.");
      if (canonical && !canonical.startsWith("https://mdftungphat.com/")) throw new Error("Canonical phải thuộc https://mdftungphat.com.");
      if (!draft && noindex) throw new Error("Nội dung published không được bật noindex. Hãy giữ bản nháp hoặc tắt noindex.");
      if (publishedAt && updatedAt && updatedAt < publishedAt) throw new Error("Ngày cập nhật không được trước ngày đăng.");
      return data;
    }
  });
})();
