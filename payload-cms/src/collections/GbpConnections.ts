import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '@/access/roles'

export const GbpConnections: CollectionConfig = {
  slug: 'gbp-connections',
  labels: { singular: 'Kết nối Google Business', plural: 'Kết nối Google Business' },
  admin: { group: 'Google Business', useAsTitle: 'branchKey' },
  access: { create: isSuperAdmin, read: isSuperAdmin, update: isSuperAdmin, delete: isSuperAdmin },
  fields: [
    { name: 'branchKey', type: 'text', required: true, unique: true },
    { name: 'projectID', type: 'text', required: true },
    { name: 'accountName', type: 'text' },
    { name: 'locationName', type: 'text' },
    { name: 'locationTitle', type: 'text' },
    { name: 'placeID', type: 'text' },
    { name: 'accessTokenCiphertext', type: 'textarea', hidden: true },
    { name: 'refreshTokenCiphertext', type: 'textarea', hidden: true },
    { name: 'tokenExpiresAt', type: 'date' },
    { name: 'status', type: 'select', required: true, defaultValue: 'not_configured', options: ['not_configured', 'connected', 'error'] },
    { name: 'lastSyncedAt', type: 'date' },
    { name: 'lastErrorSafe', type: 'text' },
  ],
  timestamps: true,
}
