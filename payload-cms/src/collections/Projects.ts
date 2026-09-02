import type { CollectionConfig } from 'payload'
import { cmsPreviewURL, contentCollection, fileRelationships, markdownField, publicationFields } from './shared'
import { dateField, mediaGallery, stringArray, vietnameseText } from '@/fields/common'

export const Projects: CollectionConfig = contentCollection({
  slug: 'projects',
  labels: { singular: 'Dự án CNC', plural: 'Dự án CNC' },
  admin: {
    group: 'Nội dung website',
    useAsTitle: 'title',
    description: 'Dự án CNC đã được phép công bố. Không nhập thông tin nhận dạng khách hàng.',
    defaultColumns: ['title', 'materialType', '_status', 'completedAt'],
    listSearchableFields: ['title', 'slug', 'materialType', 'processingType', 'area'],
    preview: (data) => cmsPreviewURL('projects', (data as { slug?: string } | undefined)?.slug),
  },
  fields: [
    vietnameseText('title', 'Tên dự án', { required: true, minLength: 8, maxLength: 120 }),
    vietnameseText('materialType', 'Loại vật liệu', { required: true }),
    vietnameseText('processingType', 'Loại gia công', { required: true }),
    vietnameseText('thickness', 'Độ dày', { required: true }),
    vietnameseText('area', 'Khu vực', { maxLength: 120, admin: { description: 'Không ghi địa chỉ khách hàng.' } }),
    stringArray('workItems', 'Hạng mục gia công', { required: true, minRows: 1 }),
    { name: 'customerRequirement', label: 'Yêu cầu khách hàng', type: 'textarea', required: true, minLength: 20, maxLength: 800 },
    stringArray('process', 'Quy trình', { required: true, minRows: 1 }),
    { name: 'result', label: 'Kết quả', type: 'textarea', required: true, minLength: 20, maxLength: 800 },
    mediaGallery('beforeImages', 'Ảnh trước'),
    mediaGallery('afterImages', 'Ảnh sau'),
    dateField('completedAt', 'Ngày thực hiện'),
    vietnameseText('quoteCta', 'CTA báo giá', { required: true, minLength: 5, maxLength: 100 }),
    markdownField,
    ...fileRelationships,
    ...publicationFields(false),
  ],
})
