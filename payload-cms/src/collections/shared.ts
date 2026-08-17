import type { CollectionConfig, Field } from 'payload'
import { canDeleteContent, canManageContent, preventEditorPublish, publicPublished } from '@/access/roles'
import { dateField, imageRelationship, mediaGallery, seoFields, slugField, vietnameseText } from '@/fields/common'
import { createPreviewToken } from '@/security/previewToken'

export const publicationFields = (rootSlug = false): Field[] => [
  slugField(rootSlug),
  imageRelationship('featuredImage', 'Ảnh đại diện', true),
  vietnameseText('featuredImageAlt', 'Alt ảnh đại diện', { required: true, minLength: 10, maxLength: 180 }),
  mediaGallery('gallery', 'Album ảnh'),
  dateField('publishedAt', 'Ngày đăng'),
  { name: 'legacyUpdatedAt', label: 'Ngày cập nhật nội dung cũ', type: 'date', required: true, access: { read: ({ req }) => Boolean(req.user) }, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } },
  { name: 'featured', label: 'Nội dung nổi bật', type: 'checkbox', defaultValue: false },
  ...seoFields,
]

export function contentCollection(config: CollectionConfig): CollectionConfig {
  return {
    ...config,
    access: {
      create: canManageContent,
      read: publicPublished,
      update: canManageContent,
      delete: canDeleteContent,
      ...config.access,
    },
    hooks: {
      ...config.hooks,
      beforeChange: [preventEditorPublish(), ...(config.hooks?.beforeChange ?? [])],
    },
    versions: {
      drafts: { autosave: false, schedulePublish: false },
      maxPerDoc: 30,
    },
    timestamps: true,
  }
}

export const markdownField: Field = {
  name: 'body',
  label: 'Nội dung chi tiết',
  type: 'textarea',
  required: true,
  minLength: 1,
  admin: { rows: 18, description: 'Markdown được giữ nguyên để tương thích dữ liệu và renderer hiện tại.' },
}

export const fileRelationships: Field[] = [
  { name: 'video', label: 'Video', type: 'relationship', relationTo: 'media', required: false },
  { name: 'catalogue', label: 'PDF / catalogue', type: 'relationship', relationTo: 'media', required: false },
]

export function cmsPreviewURL(collection: 'products' | 'articles' | 'projects' | 'pages', slug: string | undefined) {
  const value = slug ?? ''
  const token = createPreviewToken(collection, value)
  return `${process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:3000'}/preview/${collection}/${value}${token ? `?previewToken=${encodeURIComponent(token)}` : ''}`
}
