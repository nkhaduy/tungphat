import type { CollectionConfig } from 'payload'
import { cmsPreviewURL, contentCollection, fileRelationships, markdownField, publicationFields } from './shared'
import { faqField, stringArray, vietnameseText } from '@/fields/common'

export const Pages: CollectionConfig = contentCollection({
  slug: 'pages',
  labels: { singular: 'Trang dịch vụ CNC', plural: 'Trang dịch vụ CNC' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    description: 'Trang dịch vụ public ở route gốc; slug được kiểm tra để không đè route hệ thống.',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'eyebrow'],
    preview: (data) => cmsPreviewURL('pages', (data as { slug?: string } | undefined)?.slug),
  },
  fields: [
    vietnameseText('title', 'Tiêu đề', { required: true, minLength: 8, maxLength: 120 }),
    vietnameseText('eyebrow', 'Nhãn nhỏ', { required: true, minLength: 2, maxLength: 80 }),
    vietnameseText('excerpt', 'Mô tả', { required: true, minLength: 40, maxLength: 300 }),
    stringArray('materialTypes', 'Vật liệu', { required: true, minRows: 1 }),
    stringArray('workItems', 'Hạng mục', { required: true, minRows: 1 }),
    stringArray('process', 'Quy trình', { required: true, minRows: 1 }),
    stringArray('fileGuidance', 'Hướng dẫn file', { required: true, minRows: 1 }),
    vietnameseText('quoteCta', 'CTA báo giá', { required: true, minLength: 5, maxLength: 100 }),
    faqField,
    markdownField,
    ...fileRelationships,
    ...publicationFields(true),
  ],
})
