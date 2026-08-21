import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Đánh giá', plural: 'Đánh giá' },
  admin: { group: 'Google Business', useAsTitle: 'reviewerName', defaultColumns: ['reviewerName', 'rating', 'source', 'published', 'reviewedAt'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'stableKey', type: 'text', required: true, unique: true, index: true },
    { name: 'source', type: 'select', required: true, options: ['google', 'managed'] },
    { name: 'branchKey', type: 'text', required: true, index: true },
    { name: 'reviewerName', type: 'text', required: true },
    { name: 'reviewerPhotoURL', type: 'text' },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'comment', type: 'textarea' },
    { name: 'ownerReply', type: 'textarea' },
    { name: 'reviewedAt', type: 'date' },
    { name: 'published', type: 'checkbox', defaultValue: true, index: true },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
    { name: 'sourcePayload', type: 'json', access: { read: ({ req }) => Boolean(req.user) } },
  ],
  timestamps: true,
}
