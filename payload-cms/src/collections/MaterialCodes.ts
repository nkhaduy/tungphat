import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'
import { seoFields, stringArray } from '@/fields/common'

export const MaterialCodes: CollectionConfig = {
  slug: 'material-codes',
  labels: { singular: 'Mã vật liệu', plural: 'Mã vật liệu' },
  admin: { group: 'Danh mục vật liệu', useAsTitle: 'code', defaultColumns: ['code', 'name', 'supplier', 'category', 'status'], listSearchableFields: ['code', 'name', 'slug', 'materialType', 'finish'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'stableKey', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
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
    { name: 'specifications', type: 'json' },
    { name: 'featuredImage', type: 'relationship', relationTo: 'media' },
    { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'applicationGallery', type: 'array', fields: [{ name: 'image', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'sourceURL', type: 'text' },
    { name: 'sourceID', type: 'text' },
    { name: 'syncChecksum', type: 'text', index: true },
    { name: 'lastSyncedAt', type: 'date' },
    { name: 'status', type: 'select', required: true, defaultValue: 'published', options: ['published', 'draft', 'archived'] },
    ...seoFields,
  ],
  timestamps: true,
}
