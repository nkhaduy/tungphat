import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'URL cũ / chuyển hướng', plural: 'URL cũ / chuyển hướng' },
  admin: { group: 'Quản trị hệ thống', useAsTitle: 'source', defaultColumns: ['source', 'destination', 'statusCode', 'active'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'source', type: 'text', required: true, unique: true, index: true },
    { name: 'destination', type: 'text', required: true },
    { name: 'statusCode', type: 'select', required: true, defaultValue: '301', options: ['301', '302', '307', '308'] },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'note', type: 'text' },
  ],
  timestamps: true,
}
