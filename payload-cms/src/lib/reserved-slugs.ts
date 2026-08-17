export const RESERVED_ROOT_SLUGS = new Set([
  'admin', 'api', '_next', 'favicon.ico', 'icon.png', 'apple-icon.png', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest',
  'bao-gia', 'bai-viet', 'catalogue', 'chinh-sach-bao-mat', 'dieu-khoan-su-dung', 'du-an', 'gia-cong-cnc', 'gioi-thieu', 'lien-he', 'san-pham',
])

export function validateRootSlug(value: string): string | undefined {
  if (!value) return 'Slug không được rỗng'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return 'Slug chỉ gồm chữ thường, số và một dấu gạch ngang giữa các phần'
  if (RESERVED_ROOT_SLUGS.has(value)) return 'Slug trùng route tĩnh hoặc endpoint hệ thống'
  return undefined
}

