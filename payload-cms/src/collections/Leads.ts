import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/roles'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Khách hàng tiềm năng', plural: 'Khách hàng tiềm năng' },
  admin: { group: 'Kinh doanh', useAsTitle: 'fullName', defaultColumns: ['fullName', 'phone', 'type', 'status', 'createdAt'] },
  access: { create: () => true, read: canManageContent, update: canManageContent, delete: () => false },
  fields: [
    { name: 'legacyID', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'submissionKey', type: 'text', required: true, unique: true, index: true },
    { name: 'type', type: 'select', required: true, options: ['contact', 'quote'] },
    { name: 'fullName', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'company', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'product', type: 'text' },
    { name: 'material', type: 'text' },
    { name: 'thickness', type: 'text' },
    { name: 'dimensions', type: 'text' },
    { name: 'quantity', type: 'text' },
    { name: 'cncRequirement', type: 'textarea' },
    { name: 'message', type: 'textarea' },
    { name: 'sourceURL', type: 'text' },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
    { name: 'userAgent', type: 'text', admin: { hidden: true } },
    { name: 'attribution', type: 'json' },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', options: ['new', 'contacted', 'quoted', 'won', 'lost', 'spam', 'archived'] },
    { name: 'consentAt', type: 'date', required: true },
  ],
  timestamps: true,
}
