import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Danh mục vật liệu', plural: 'Danh mục vật liệu' },
  admin: { group: 'Danh mục vật liệu', useAsTitle: 'name', defaultColumns: ['name', 'slug', 'supplier', 'parent'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'supplier', type: 'relationship', relationTo: 'suppliers' as never },
    { name: 'parent', type: 'relationship', relationTo: 'categories' as never },
    { name: 'description', type: 'textarea' },
    { name: 'sourceID', type: 'text', index: true },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
  ],
  timestamps: true,
}
