export const reservedRootSlugs = new Set([
  "admin", "api", "bao-gia", "bai-viet", "catalogue", "chinh-sach-bao-mat",
  "dieu-khoan-su-dung", "du-an", "favicon.ico", "lien-he", "manifest.webmanifest",
  "robots.txt", "san-pham", "sitemap.xml"
]);

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
