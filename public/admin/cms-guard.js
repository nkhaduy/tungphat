/* global CMS */
(function () {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const imagePattern = /^\/[^\s]+\.(avif|webp|png|jpe?g)$/i;

  CMS.registerEventListener({
    name: "prePublish",
    handler: ({ entry }) => {
      const data = entry.get("data");
      const title = String(data.get("title") || "").trim();
      const slug = String(data.get("slug") || "").trim();
      const description = String(data.get("seoDescription") || "").trim();
      const image = String(data.get("featuredImage") || "").trim();
      const alt = String(data.get("featuredImageAlt") || "").trim();
      const canonical = String(data.get("canonical") || "").trim();
      if (!title || !slug || !description) throw new Error("Không thể publish: title, slug và SEO description là bắt buộc.");
      if (!slugPattern.test(slug)) throw new Error("Slug chỉ được dùng chữ thường, số và dấu gạch ngang.");
      if (description.length < 80 || description.length > 170) throw new Error("SEO description phải dài 80–170 ký tự.");
      if (image && !imagePattern.test(image)) throw new Error("Ảnh đại diện phải là AVIF, WebP, PNG hoặc JPEG.");
      if (image && alt.length < 10) throw new Error("Alt text ảnh đại diện phải có ít nhất 10 ký tự.");
      if (canonical && !canonical.startsWith("https://mdftungphat.com/")) throw new Error("Canonical phải thuộc https://mdftungphat.com.");
      return data;
    }
  });
})();
