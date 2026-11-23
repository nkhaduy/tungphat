import type { CollectionConfig } from 'payload'
import { roleOf } from '@/access/roles'

/** Internal publish/build history. Mutations are only available through guarded runtime endpoints. */
export const SiteBuilds: CollectionConfig = {
  slug: 'site-builds',
  labels: { singular: 'Bản dựng website', plural: 'Bản dựng website' },
  admin: {
    hidden: true,
    group: 'Quản trị hệ thống',
    useAsTitle: 'status',
    defaultColumns: ['status', 'branch', 'commitSha', 'articleSlug', 'updatedAt'],
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(roleOf(req)),
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'requestId', type: 'text', required: true, unique: true, index: true, access: { read: () => false } },
    { name: 'buildId', label: 'Build UUID', type: 'text', unique: true, index: true, access: { read: ({ req }) => Boolean(req.user) } },
    {
      name: 'status', label: 'Trạng thái', type: 'select', required: true, index: true,
      options: [
        { label: 'Đang chờ', value: 'queued' },
        { label: 'Đang build', value: 'building' },
        { label: 'Đang triển khai', value: 'deploying' },
        { label: 'Đã cập nhật preview', value: 'live' },
        { label: 'Thất bại', value: 'failed' },
      ],
    },
    { name: 'branch', label: 'Branch', type: 'text', required: true },
    { name: 'commitSha', label: 'Commit', type: 'text' },
    { name: 'articleSlug', label: 'Bài viết', type: 'text' },
    { name: 'triggerReason', label: 'Nguyên nhân', type: 'select', options: [{ label: 'Xuất bản hoặc cập nhật', value: 'publish' }, { label: 'Gỡ xuất bản', value: 'unpublish' }, { label: 'Thử lại', value: 'retry' }] },
    { name: 'errorCode', label: 'Mã lỗi', type: 'text' },
    { name: 'createdAt', label: 'Bắt đầu', type: 'date', required: true, index: true },
    { name: 'completedAt', label: 'Kết thúc', type: 'date' },
  ],
  timestamps: true,
}
