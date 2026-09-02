import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'
import { seoFields, stringArray } from '@/fields/common'

export const MaterialCodes: CollectionConfig = {
  slug: 'material-codes',
  labels: { singular: 'Mã màu / catalogue', plural: 'Mã màu / catalogue' },
  admin: { group: 'Sản phẩm & mã hàng', useAsTitle: 'code', defaultColumns: ['code', 'name', 'supplier', 'category', 'status'], listSearchableFields: ['code', 'name', 'slug', 'materialType', 'finish'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'stableKey', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'supplier', type: 'relationship', relationTo: 'suppliers' as never, required: true, index: true },
    { name: 'code', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'relationship', relationTo: 'categories' as never },
    { name: 'subcategory', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'materialType', type: 'text' },
    { name: 'finish', type: 'text' },
    stringArray('dimensions', 'Kích thước'),
    stringArray('thicknesses', 'Độ dày'),
    { name: 'specifications', type: 'json', admin: { className: 'tp-advanced-field' } },
    { name: 'featuredImage', type: 'relationship', relationTo: 'media' },
    { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'applicationGallery', type: 'array', fields: [{ name: 'image', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'sourceURL', type: 'text', admin: { className: 'tp-advanced-field' } },
    { name: 'sourceID', type: 'text', admin: { className: 'tp-advanced-field' } },
    { name: 'syncChecksum', type: 'text', index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'lastSyncedAt', type: 'date', admin: { className: 'tp-advanced-field' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'published', options: [{ label: 'Đang hiển thị', value: 'published' }, { label: 'Bản nháp', value: 'draft' }, { label: 'Lưu trữ / không dùng', value: 'archived' }] },
    ...seoFields,
  ],
  timestamps: true,
}
