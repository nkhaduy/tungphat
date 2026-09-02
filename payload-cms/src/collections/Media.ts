import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'
import { MAX_MEDIA_BYTES } from '@/security/mediaUpload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Hình ảnh & tài liệu', plural: 'Hình ảnh & tài liệu' },
  admin: {
    group: 'Hình ảnh & tài liệu',
    useAsTitle: 'filename',
    description: 'Ảnh, video và catalogue dùng cho website. Hãy nhập alt text mô tả nội dung ảnh.',
    defaultColumns: ['mediaKind', 'roomApplication', 'updatedAt'],
    listSearchableFields: ['filename', 'alt', 'caption'],
  },
  access: {
    create: canManageContent,
    read: () => true,
    update: canManageContent,
    delete: canDeleteContent,
  },
  hooks: {
    beforeValidate: [({ req }) => {
      const fileSize = req.file?.size
      if (typeof fileSize === 'number' && fileSize > MAX_MEDIA_BYTES) {
        throw new Error('Tệp tải lên không được vượt quá 15 MB.')
      }
    }],
    beforeChange: [({ data, req, operation }) => {
      if (operation === 'create' && req.user) data.uploadedBy = req.user.id
      if (!data.r2Key && typeof data.filename === 'string') data.r2Key = `uploads/${data.filename}`
      return data
    }],
    afterRead: [({ doc }) => {
      if (typeof doc.r2Key === 'string' && doc.r2Key) {
        const publicMediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/$/u, '')
        doc.url = publicMediaBase
          ? new URL(doc.r2Key, `${publicMediaBase}/`).toString()
          : `/media/${doc.r2Key}`
        doc.thumbnailURL = doc.url
      }
      return doc
    }],
  },
  fields: [
    { name: 'alt', label: 'Alt text', type: 'text', required: true, minLength: 3, maxLength: 180, admin: { description: 'Mô tả ngắn nội dung và mục đích của ảnh; không bắt đầu bằng “Hình ảnh…”.' } },
    { name: 'caption', label: 'Chú thích', type: 'textarea', maxLength: 300 },
    { name: 'mediaKind', label: 'Loại nội dung', type: 'select', required: true, defaultValue: 'content', options: [
      { label: 'Ảnh nội dung', value: 'content' },
      { label: 'Ảnh sản phẩm', value: 'product' },
      { label: 'Ảnh dự án', value: 'project' },
      { label: 'Logo / thương hiệu', value: 'brand' },
      { label: 'Catalogue / tài liệu', value: 'document' },
      { label: 'Video', value: 'video' },
    ] },
    { name: 'uploadedBy', label: 'Người tải lên', type: 'relationship', relationTo: 'users', access: { read: ({ req }) => Boolean(req.user) }, admin: { readOnly: true, position: 'sidebar', className: 'tp-advanced-field' } },
    { name: 'r2Key', label: 'R2 object key', type: 'text', unique: true, index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'sourceURL', label: 'URL nguồn', type: 'text', admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'checksum', label: 'Checksum', type: 'text', index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'roomApplication', label: 'Ảnh phòng / ứng dụng', type: 'checkbox', defaultValue: false },
  ],
  upload: {
    allowRestrictedFileTypes: false,
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf', 'video/mp4', 'video/webm'],
    pasteURL: false,
  },
  timestamps: true,
}
