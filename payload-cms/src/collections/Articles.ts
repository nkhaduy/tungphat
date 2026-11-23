import type { CollectionConfig, Field } from 'payload'
import { cmsPreviewURL, contentCollection, fileRelationships, publicationFields } from './shared'
import { faqField, stringArray, vietnameseText } from '@/fields/common'
import { articleLexicalEditor, articleEditorHasContent, articleEditorPlainText } from './articleRichText'
import { hasPublicArticleChanged, shouldRebuildPublishedSite, shouldTriggerSiteBuild } from '@/security/siteRebuild'
import { requestBuild } from '@/endpoints/siteBuilds'

const legacyBodyField = {
  name: 'body',
  label: 'Nội dung Markdown cũ',
  type: 'textarea' as const,
  required: true,
  minLength: 1,
  admin: { rows: 3, description: 'Dữ liệu bài cũ được giữ nguyên. Bài mới dùng trình soạn thảo khối ở phía trên.' },
}

const legacyBodyHiddenField = {
  name: 'legacyBodyHidden',
  label: 'Chỉ dùng nội dung block',
  type: 'checkbox' as const,
  defaultValue: false,
  admin: { description: 'Bật khi nội dung block đã thay thế hoàn toàn phần Markdown cũ bên dưới.' },
}

const articleSidebarFields = new Set(['category', 'tags', 'author', 'slug', 'featuredImage', 'featuredImageAlt', 'publishedAt', 'featured', 'seo'])
const inArticleSidebar = (field: Field): Field => {
  if (!('name' in field) || !articleSidebarFields.has(field.name)) return field
  return { ...field, admin: { ...field.admin, position: 'sidebar' } } as Field
}

export const Articles: CollectionConfig = contentCollection({
  slug: 'articles',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: {
    group: 'Nội dung website',
    useAsTitle: 'title',
    description: 'Tin tức và nội dung hướng dẫn của Tùng Phát.',
    defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    listSearchableFields: ['title', 'slug', 'category', 'author'],
    preview: (data) => cmsPreviewURL('articles', (data as { slug?: string } | undefined)?.slug),
    components: { edit: { beforeDocumentControls: ['/components/admin/SiteBuildStatus'] } },
  },
  fields: [
    vietnameseText('title', 'Tiêu đề', { required: true, minLength: 10, maxLength: 120 }),
    vietnameseText('excerpt', 'Tóm tắt', { required: true, minLength: 40, maxLength: 240 }),
    { name: 'editorContent', label: 'Nội dung bài viết', type: 'richText', editor: articleLexicalEditor, admin: { description: 'Soạn theo từng khối. Dùng + để chèn ảnh, bảng, thư viện ảnh, FAQ, nút, mã hoặc video YouTube.' } },
    inArticleSidebar(vietnameseText('category', 'Danh mục', { required: true, minLength: 2, maxLength: 80 })),
    inArticleSidebar(stringArray('tags', 'Tags')),
    inArticleSidebar(vietnameseText('author', 'Tác giả', { required: true, defaultValue: 'Ban biên tập Tùng Phát', minLength: 2, maxLength: 80 })),
    stringArray('relatedProducts', 'Slug sản phẩm liên quan'),
    stringArray('relatedArticles', 'Slug bài viết liên quan'),
    faqField,
    { type: 'collapsible', label: 'Nội dung cũ', admin: { initCollapsed: true }, fields: [legacyBodyHiddenField, legacyBodyField] },
    ...fileRelationships,
    ...publicationFields(false).map(inArticleSidebar),
  ],
  hooks: {
    beforeValidate: [({ data, originalDoc, operation }) => {
      const nextData = data ?? {}
      const editorContent = nextData.editorContent ?? originalDoc?.editorContent
      const plainText = articleEditorPlainText(editorContent)
      const currentBody = typeof nextData.body === 'string' ? nextData.body : typeof originalDoc?.body === 'string' ? originalDoc.body : ''
      const bodyIsEmptyOrPlaceholder = !currentBody.trim() || currentBody === 'Đang soạn nội dung…'

      if (articleEditorHasContent(editorContent) && bodyIsEmptyOrPlaceholder) {
        nextData.body = plainText || 'Bài viết có nội dung hình ảnh hoặc nội dung dạng khối.'
      }
      else if (operation === 'create' && !currentBody.trim()) nextData.body = 'Đang soạn nội dung…'

      if (articleEditorHasContent(editorContent) && bodyIsEmptyOrPlaceholder) nextData.legacyBodyHidden = true
      else if (typeof nextData.legacyBodyHidden !== 'boolean') nextData.legacyBodyHidden = originalDoc?.legacyBodyHidden === true

      const status = nextData._status ?? originalDoc?._status
      if (status === 'published' && currentBody === 'Đang soạn nội dung…' && !articleEditorHasContent(editorContent)) {
        throw new Error('Hãy thêm nội dung bài viết trước khi xuất bản.')
      }

      return nextData
    }],
    afterChange: [async ({ data, doc, operation, previousDoc, req, context }) => {
      if (!shouldTriggerSiteBuild(process.env.CMS_ENVIRONMENT)) return doc
      let isAutosave = context.autosave === true
      if (!isAutosave && typeof req.url === 'string') {
        try { isAutosave = new URL(req.url).searchParams.get('autosave') === 'true' } catch { /* request URL may be relative */ }
      }
      const shouldQueue = shouldRebuildPublishedSite({
        operation,
        status: doc._status,
        previousStatus: previousDoc?._status,
        submittedStatus: data._status,
        publicContentChanged: hasPublicArticleChanged(previousDoc as Record<string, unknown> | undefined, doc as Record<string, unknown>),
        autosave: isAutosave,
      })
      if (!shouldQueue) return doc

      const reason = previousDoc?._status === 'published' && doc._status !== 'published' ? 'unpublish' : 'publish'
      try {
        const result = await requestBuild(req.payload, { articleSlug: doc.slug, reason })
        const fields = { msg: 'Static site build trigger', article: doc.slug, status: result.status, buildId: result.buildId }
        if (result.status === 'queued') req.payload.logger.info(fields)
        else req.payload.logger.warn(fields)
      } catch (error) {
        req.payload.logger.error({ err: error, article: doc.slug, msg: 'Failed to record static site build trigger' })
      }
      return doc
    }],
    afterDelete: [async ({ doc, req }) => {
      if (!shouldTriggerSiteBuild(process.env.CMS_ENVIRONMENT)) return doc
      if (doc._status !== 'published') return doc
      try {
        const result = await requestBuild(req.payload, { articleSlug: doc.slug, reason: 'unpublish' })
        const fields = { msg: 'Static site build trigger after published article deletion', article: doc.slug, status: result.status, buildId: result.buildId }
        if (result.status === 'queued') req.payload.logger.info(fields)
        else req.payload.logger.warn(fields)
      } catch (error) {
        req.payload.logger.error({ err: error, article: doc.slug, msg: 'Failed to record build after published article deletion' })
      }
      return doc
    }],
  },
}, { autosave: { interval: 1_500, showSaveDraftButton: true } })
