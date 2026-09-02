import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: { singular: 'Nhà cung cấp', plural: 'Nhà cung cấp' },
  admin: { group: 'Sản phẩm & mã hàng', useAsTitle: 'name', defaultColumns: ['name', 'enabled', 'updatedAt'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea' },
    { name: 'logo', type: 'relationship', relationTo: 'media' },
    { name: 'sourceURL', type: 'text', admin: { className: 'tp-advanced-field' } },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'lastSyncedAt', type: 'date', admin: { className: 'tp-advanced-field' } },
    { name: 'syncChecksum', type: 'text', admin: { readOnly: true, className: 'tp-advanced-field' } },
  ],
  timestamps: true,
}
