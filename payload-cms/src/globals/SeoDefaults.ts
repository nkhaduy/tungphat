import type { GlobalConfig } from 'payload'
import { contentGlobalAccess } from './access'
import { imageRelationship, vietnameseText } from '@/fields/common'

export const SeoDefaults: GlobalConfig = {
  slug: 'seo-defaults', label: 'SEO mặc định', access: contentGlobalAccess,
  admin: { group: 'Cấu hình website', description: 'Giá trị SEO dự phòng của website; không ghi đè SEO đã nhập ở từng nội dung.' },
  fields: [
    { name: 'siteUrl', label: 'Canonical domain', type: 'text', required: true, defaultValue: 'https://mdftungphat.com', validate: (value: unknown) => value === 'https://mdftungphat.com' || 'Canonical bắt buộc là https://mdftungphat.com' },
    vietnameseText('siteName', 'Tên site', { required: true, minLength: 2, maxLength: 80 }),
    vietnameseText('defaultTitle', 'Title mặc định', { required: true, minLength: 20, maxLength: 65 }),
    { name: 'defaultDescription', label: 'Description mặc định', type: 'textarea', required: true, minLength: 80, maxLength: 170 },
    imageRelationship('defaultOgImage', 'OG image mặc định', true),
  ],
}
