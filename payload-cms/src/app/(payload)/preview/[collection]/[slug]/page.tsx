import config from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { validPreviewToken } from '@/security/previewToken'
import AuthenticatedPreview from '@/components/admin/AuthenticatedPreview'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Xem trước nội dung · Tùng Phát CMS', robots: { index: false, follow: false, noarchive: true } }

const previewCollections = ['products', 'articles', 'projects', 'pages'] as const
type PreviewCollection = (typeof previewCollections)[number]

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ collection: string; slug: string }>; searchParams: Promise<{ previewToken?: string }> }) {
  const { collection: requestedCollection, slug } = await params
  if (!previewCollections.includes(requestedCollection as PreviewCollection)) notFound()
  const collection = requestedCollection as PreviewCollection
  if (process.env.CMS_ENVIRONMENT === 'production') {
    const { previewToken = '' } = await searchParams
    if (!validPreviewToken(collection, slug, previewToken)) notFound()
  }
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: new Headers(await headers()) })
  if (!auth.user) notFound()
  const result = await payload.find({ collection, where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 1, overrideAccess: false, user: auth.user })
  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) notFound()
  const previewData = projectPreviewData(collection, doc)
  const previewURL = `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gotungphat.com').replace(/\/$/u, '')}/cms-preview`
  return <main className="min-h-screen bg-white"><AuthenticatedPreview collection={collection} data={previewData} previewURL={previewURL} /></main>
}

const fieldsByCollection: Record<PreviewCollection, string[]> = {
  articles: ['title', 'slug', 'excerpt', 'body', 'editorContent', 'legacyBodyHidden', 'featuredImage', 'featuredImageAlt', 'category', 'tags', 'author', 'publishedAt', 'updatedAt', 'faq', 'relatedProducts', 'relatedArticles'],
  products: ['title', 'slug', 'category', 'excerpt', 'body', 'featuredImage', 'featuredImageAlt', 'materialType', 'supplier', 'dimensions', 'thicknesses', 'surfaces', 'standards', 'applications', 'advantages', 'limitations', 'orderingSteps', 'status', 'quoteCta', 'publishedAt', 'updatedAt', 'faq', 'relatedArticles'],
  projects: ['title', 'slug', 'body', 'featuredImage', 'featuredImageAlt', 'materialType', 'processingType', 'thickness', 'area', 'workItems', 'customerRequirement', 'process', 'result', 'completedAt', 'publishedAt', 'updatedAt', 'quoteCta'],
  pages: ['title', 'slug', 'eyebrow', 'excerpt', 'body', 'featuredImage', 'featuredImageAlt', 'materialTypes', 'workItems', 'process', 'fileGuidance', 'quoteCta', 'publishedAt', 'updatedAt', 'faq'],
}

const safeLexicalKeys = new Set(['root', 'type', 'version', 'children', 'text', 'format', 'detail', 'mode', 'style', 'direction', 'indent', 'tag', 'listType', 'start', 'checked', 'value', 'fields', 'blockType', 'relationTo', 'url', 'alt', 'caption', 'id', 'width', 'height', 'columns', 'rows', 'cells', 'items', 'label', 'title', 'description', 'href', 'code', 'language', 'question', 'answer', 'image', 'images'])

function projectLexical(value: unknown, depth = 0): unknown {
  if (depth > 32) return undefined
  if (typeof value === 'string') return value.slice(0, 20_000)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) return value.slice(0, 2_000).map((item) => projectLexical(item, depth + 1)).filter((item) => item !== undefined)
  if (!value || typeof value !== 'object') return undefined
  const projected: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
    if (!safeLexicalKeys.has(key)) continue
    const safe = projectLexical(item, depth + 1)
    if (safe !== undefined) projected[key] = safe
  }
  return projected
}

function projectMedia(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const media = value as Record<string, unknown>
  return { id: media.id, url: media.url, alt: media.alt, width: media.width, height: media.height }
}

function projectPreviewData(collection: PreviewCollection, doc: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const field of fieldsByCollection[collection]) {
    if (!(field in doc)) continue
    data[field] = field === 'editorContent' ? projectLexical(doc[field]) : field === 'featuredImage' ? projectMedia(doc[field]) : doc[field]
  }
  data.draft = true
  return data
}
