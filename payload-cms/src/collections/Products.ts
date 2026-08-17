import type { CollectionConfig } from 'payload'
import { cmsPreviewURL, contentCollection, fileRelationships, markdownField, publicationFields } from './shared'
import { faqField, stringArray, vietnameseText } from '@/fields/common'

export const Products: CollectionConfig = contentCollection({
  slug: 'products',
  labels: { singular: 'Sản phẩm', plural: 'Sản phẩm' },
  admin: {
    group: 'Sản phẩm và dịch vụ',
    useAsTitle: 'title',
    description: 'Vật liệu và sản phẩm đang được Tùng Phát giới thiệu trên website.',
    defaultColumns: ['title', 'category', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'category', 'materialType', 'supplier'],
    preview: (data) => cmsPreviewURL('products', (data as { slug?: string } | undefined)?.slug),
  },
  fields: [
    vietnameseText('title', 'Tên sản phẩm', { required: true, minLength: 5, maxLength: 120 }),
    vietnameseText('category', 'Danh mục', { required: true, minLength: 2, maxLength: 80 }),
    vietnameseText('excerpt', 'Mô tả ngắn', { required: true, minLength: 40, maxLength: 260 }),
    vietnameseText('materialType', 'Loại vật liệu', { required: true, minLength: 2, maxLength: 100 }),
    vietnameseText('supplier', 'Thương hiệu / nhà cung cấp', { maxLength: 100, admin: { description: 'Không ghi đại lý chính thức nếu chưa có bằng chứng.' } }),
    stringArray('thicknesses', 'Độ dày'),
    stringArray('dimensions', 'Kích thước'),
    stringArray('surfaces', 'Bề mặt'),
    stringArray('standards', 'Tiêu chuẩn'),
    stringArray('applications', 'Ứng dụng', { required: true, minRows: 1 }),
    stringArray('advantages', 'Ưu điểm phù hợp', { required: true, minRows: 1 }),
    stringArray('limitations', 'Lưu ý / giới hạn', { required: true, minRows: 1 }),
    stringArray('orderingSteps', 'Quy trình đặt hàng', { required: true, minRows: 1 }),
    { name: 'availability', label: 'Trạng thái cung cấp', type: 'select', required: true, defaultValue: 'available', options: [{ label: 'Còn cung cấp', value: 'available' }, { label: 'Ngừng cung cấp', value: 'discontinued' }, { label: 'Trang hướng dẫn / hub', value: 'guide' }] },
    vietnameseText('quoteCta', 'CTA báo giá', { required: true, minLength: 5, maxLength: 100 }),
    stringArray('relatedArticles', 'Slug bài viết liên quan'),
    faqField,
    markdownField,
    ...fileRelationships,
    ...publicationFields(true),
  ],
})
