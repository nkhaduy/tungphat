import type { CollectionConfig } from 'payload'
import { cmsPreviewURL, contentCollection, fileRelationships, markdownField, publicationFields } from './shared'
import { faqField, stringArray, vietnameseText } from '@/fields/common'

export const Articles: CollectionConfig = contentCollection({
  slug: 'articles',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    description: 'Tin tức và nội dung hướng dẫn của Tùng Phát.',
    defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    listSearchableFields: ['title', 'slug', 'category', 'author'],
    preview: (data) => cmsPreviewURL('articles', (data as { slug?: string } | undefined)?.slug),
  },
  fields: [
    vietnameseText('title', 'Tiêu đề', { required: true, minLength: 10, maxLength: 120 }),
    vietnameseText('excerpt', 'Tóm tắt', { required: true, minLength: 40, maxLength: 240 }),
    vietnameseText('category', 'Danh mục', { required: true, minLength: 2, maxLength: 80 }),
    stringArray('tags', 'Tags'),
    vietnameseText('author', 'Tác giả', { required: true, defaultValue: 'Ban biên tập Tùng Phát', minLength: 2, maxLength: 80 }),
    stringArray('relatedProducts', 'Slug sản phẩm liên quan'),
    stringArray('relatedArticles', 'Slug bài viết liên quan'),
    faqField,
    markdownField,
    ...fileRelationships,
    ...publicationFields(false),
  ],
})
