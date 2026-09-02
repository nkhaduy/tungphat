import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/roles'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Khách hỏi hàng', plural: 'Khách hỏi hàng' },
  admin: { group: 'Khách hỏi hàng', useAsTitle: 'fullName', defaultColumns: ['fullName', 'phone', 'type', 'status', 'createdAt'] },
  access: { create: () => true, read: canManageContent, update: canManageContent, delete: () => false },
  fields: [
    { name: 'legacyID', type: 'text', unique: true, index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'submissionKey', type: 'text', required: true, unique: true, index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'type', type: 'select', required: true, options: [{ label: 'Liên hệ', value: 'contact' }, { label: 'Báo giá', value: 'quote' }] },
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
    { name: 'attribution', type: 'json', admin: { className: 'tp-advanced-field' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', options: [{ label: 'Mới', value: 'new' }, { label: 'Đã liên hệ', value: 'contacted' }, { label: 'Đã báo giá', value: 'quoted' }, { label: 'Đã chốt', value: 'won' }, { label: 'Không tiếp tục', value: 'lost' }, { label: 'Spam', value: 'spam' }, { label: 'Lưu trữ', value: 'archived' }] },
    { name: 'consentAt', type: 'date', required: true },
  ],
  timestamps: true,
}
