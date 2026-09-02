import type { GlobalConfig } from 'payload'
import { contentGlobalAccess } from './access'
import { imageRelationship, stringArray, vietnameseText } from '@/fields/common'

export const BusinessSettings: GlobalConfig = {
  slug: 'business-settings',
  label: 'Liên hệ & chi nhánh',
  admin: { group: 'Website & liên hệ', description: 'Thông tin liên hệ, địa điểm và CTA dùng trên website.' },
  access: contentGlobalAccess,
  fields: [
    vietnameseText('businessName', 'Tên doanh nghiệp', { required: true, minLength: 3, maxLength: 160 }),
    vietnameseText('displayName', 'Tên hiển thị', { required: true, minLength: 2, maxLength: 100 }),
    vietnameseText('taxId', 'Mã số thuế', { required: true, minLength: 8, maxLength: 30 }),
    { name: 'website', label: 'Website canonical', type: 'text', required: true, defaultValue: 'https://mdftungphat.com', admin: { className: 'tp-advanced-field' }, validate: (value: unknown) => value === 'https://mdftungphat.com' || 'Bắt buộc https://mdftungphat.com' },
    vietnameseText('phoneDisplay', 'Hotline hiển thị', { required: true }),
    { name: 'phoneE164', label: 'Hotline E.164', type: 'text', required: true, validate: (value: unknown) => typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value) ? true : 'Số điện thoại E.164 không hợp lệ' },
    { name: 'zaloUrl', label: 'Zalo', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    stringArray('openingHours', 'Giờ làm việc'),
    stringArray('serviceAreas', 'Khu vực phục vụ', { required: true, minRows: 1 }),
    {
      name: 'locations', label: 'Địa điểm và Google Maps', type: 'array', required: true, minRows: 1,
      fields: [
        vietnameseText('locationId', 'ID', { required: true, admin: { className: 'tp-advanced-field' } }), vietnameseText('shortId', 'Mã ngắn', { required: true, admin: { className: 'tp-advanced-field' } }),
        vietnameseText('name', 'Tên', { required: true }), vietnameseText('address', 'Địa chỉ hiển thị', { required: true }),
        vietnameseText('streetAddress', 'Số nhà / đường', { required: true }), vietnameseText('addressLocality', 'Thành phố', { required: true }),
        vietnameseText('addressRegion', 'Tỉnh / thành', { required: true }), vietnameseText('addressCountry', 'Mã quốc gia', { required: true, defaultValue: 'VN', minLength: 2, maxLength: 2 }),
        imageRelationship('image', 'Ảnh địa điểm', true), vietnameseText('imageAlt', 'Alt ảnh địa điểm', { required: true, minLength: 10, maxLength: 180 }),
        { name: 'embedSrc', label: 'URL nhúng Google Maps', type: 'text', required: true, admin: { className: 'tp-advanced-field' } }, { name: 'directionsUrl', label: 'URL chỉ đường', type: 'text', required: true, admin: { className: 'tp-advanced-field' } },
      ],
    },
    stringArray('socialLinks', 'Social links'),
    { name: 'footerDescription', label: 'Nội dung footer', type: 'textarea', required: true, minLength: 40, maxLength: 300 },
    vietnameseText('primaryCtaLabel', 'Nhãn CTA chính', { required: true }),
    vietnameseText('primaryCtaUrl', 'URL CTA chính', { required: true }),
    { name: 'localBusinessType', type: 'text', defaultValue: 'LocalBusiness', admin: { hidden: true, readOnly: true } },
  ],
}
