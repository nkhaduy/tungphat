import type { Field } from 'payload'
import { validateRootSlug } from '@/lib/reserved-slugs'

export const vietnameseText = (name: string, label: string, options: Record<string, unknown> = {}): Field => ({
  name,
  label,
  type: 'text',
  ...options,
}) as Field

export const slugField = (root = false): Field => ({
  name: 'slug',
  label: 'Slug URL',
  type: 'text',
  required: true,
  unique: true,
  admin: {
    description: root
      ? 'Chỉ chữ thường, số và dấu gạch ngang. Không dùng slug của route hệ thống.'
      : 'Chỉ chữ thường, số và dấu gạch ngang.',
  },
  validate: (value: unknown) => {
    if (typeof value !== 'string') return 'Slug là bắt buộc'
    if (root) return validateRootSlug(value) ?? true
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? true : 'Slug không hợp lệ'
  },
})

export const markdownBody: Field = {
  name: 'body',
  label: 'Nội dung Markdown',
  type: 'textarea',
  required: true,
  minLength: 1,
  admin: {
    description: 'Giữ định dạng Markdown hiện tại để migration không làm mất nội dung. Có thể chuyển sang rich text ở giai đoạn sau.',
    rows: 18,
  },
}

export const stringArray = (name: string, label: string, options: { required?: boolean; minRows?: number } = {}): Field => ({
  name,
  label,
  type: 'array',
  required: options.required,
  minRows: options.minRows,
  fields: [{ name: 'value', label: 'Giá trị', type: 'text', required: true }],
})

export const faqField: Field = {
  name: 'faq',
  label: 'Câu hỏi thường gặp',
  type: 'array',
  fields: [
    { name: 'question', label: 'Câu hỏi', type: 'text', required: true, minLength: 10, maxLength: 180 },
    { name: 'answer', label: 'Trả lời', type: 'textarea', required: true, minLength: 20, maxLength: 1200 },
  ],
}

export const seoFields: Field[] = [
  {
    name: 'seo',
    label: 'SEO và chia sẻ',
    type: 'group',
    admin: { description: 'Thông tin dùng cho kết quả tìm kiếm và Open Graph. Không thay đổi SEO production trong bước này.' },
    fields: [
      { name: 'title', label: 'SEO title', type: 'text', required: true, minLength: 20, maxLength: 65 },
      { name: 'description', label: 'Meta description', type: 'textarea', required: true, minLength: 80, maxLength: 170 },
      { name: 'canonical', label: 'Canonical tùy chỉnh', type: 'text', required: false, admin: { className: 'tp-advanced-field' }, validate: (value: unknown) => !value || (typeof value === 'string' && /^https:\/\/mdftungphat\.com(?:\/.*)?$/.test(value)) || 'Canonical phải thuộc https://mdftungphat.com' },
      { name: 'noindex', label: 'Không lập chỉ mục', type: 'checkbox', defaultValue: false, admin: { className: 'tp-advanced-field' } },
      { name: 'ogImage', label: 'Ảnh Open Graph', type: 'relationship', relationTo: 'media', required: false },
    ],
  },
]

export const imageRelationship = (name: string, label: string, required = false): Field => ({
  name,
  label,
  type: 'relationship',
  relationTo: 'media',
  required,
  admin: { description: 'Chọn ảnh từ Media; Alt text nằm ngay bên dưới để bảo đảm khả năng tiếp cận.' },
})

export const mediaGallery = (name: string, label: string): Field => ({
  name,
  label,
  type: 'array',
  fields: [{ name: 'image', label: 'Ảnh', type: 'relationship', relationTo: 'media', required: true }],
})

export const dateField = (name: string, label: string, required = true): Field => ({ name, label, type: 'date', required, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } })
