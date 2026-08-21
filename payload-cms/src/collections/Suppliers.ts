import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: { singular: 'Nhà cung cấp', plural: 'Nhà cung cấp' },
  admin: { group: 'Danh mục vật liệu', useAsTitle: 'name', defaultColumns: ['name', 'key', 'enabled', 'lastSyncedAt'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea' },
    { name: 'logo', type: 'relationship', relationTo: 'media' },
    { name: 'sourceURL', type: 'text' },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'lastSyncedAt', type: 'date' },
    { name: 'syncChecksum', type: 'text', admin: { readOnly: true } },
  ],
  timestamps: true,
}
