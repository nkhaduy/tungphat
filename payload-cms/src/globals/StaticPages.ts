import type { GlobalConfig } from 'payload'
import { contentGlobalAccess } from './access'

export const StaticPages: GlobalConfig = {
  slug: 'static-pages', label: 'Nội dung trang chủ / liên hệ / báo giá', access: contentGlobalAccess,
  admin: { group: 'Nội dung website', description: 'Nội dung ngắn của trang chủ, liên hệ và báo giá.' },
  fields: [
    { name: 'legacyUpdatedAt', label: 'Ngày cập nhật', type: 'date', required: true, access: { read: ({ req }) => Boolean(req.user) }, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } },
    { name: 'homeHeroDescription', label: 'Mô tả hero trang chủ', type: 'textarea', required: true, minLength: 80, maxLength: 260 },
    { name: 'contactIntro', label: 'Giới thiệu trang liên hệ', type: 'textarea', required: true, minLength: 40, maxLength: 300 },
    { name: 'quoteIntro', label: 'Giới thiệu trang báo giá', type: 'textarea', required: true, minLength: 80, maxLength: 300 },
  ],
}
