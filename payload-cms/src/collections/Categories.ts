import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Danh mục vật liệu', plural: 'Danh mục vật liệu' },
  admin: { group: 'Sản phẩm & mã hàng', useAsTitle: 'name', defaultColumns: ['name', 'supplier', 'parent'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'supplier', type: 'relationship', relationTo: 'suppliers' as never },
    { name: 'parent', type: 'relationship', relationTo: 'categories' as never },
    { name: 'description', type: 'textarea' },
    { name: 'sourceID', type: 'text', index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'displayOrder', type: 'number', defaultValue: 0, admin: { className: 'tp-advanced-field' } },
  ],
  timestamps: true,
}
