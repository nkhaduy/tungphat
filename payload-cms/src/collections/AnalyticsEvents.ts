import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/roles'

export const AnalyticsEvents: CollectionConfig = {
  slug: 'analytics-events',
  labels: { singular: 'Số liệu truy cập', plural: 'Số liệu truy cập' },
  admin: { group: 'Quản trị hệ thống', useAsTitle: 'eventName', defaultColumns: ['eventName', 'path', 'occurredAt'] },
  access: { create: () => true, read: canManageContent, update: () => false, delete: canManageContent },
  fields: [
    { name: 'eventID', type: 'text', required: true, unique: true, index: true },
    { name: 'sessionID', type: 'text', required: true, index: true },
    { name: 'visitorID', type: 'text', required: true, index: true },
    { name: 'eventName', type: 'text', required: true, index: true },
    { name: 'occurredAt', type: 'date', required: true, index: true },
    { name: 'path', type: 'text', required: true, index: true },
    { name: 'pageTitle', type: 'text' },
    { name: 'contentType', type: 'text' },
    { name: 'contentID', type: 'text' },
    { name: 'metadata', type: 'json' },
    { name: 'isTest', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
