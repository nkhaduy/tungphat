import config from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { validPreviewToken } from '@/security/previewToken'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Xem trước nội dung · Tùng Phát CMS' }

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
  const media = doc.featuredImage && typeof doc.featuredImage === 'object' ? doc.featuredImage as Record<string, unknown> : undefined
  const imageURL = typeof media?.url === 'string' ? media.url : undefined

  return <main style={{ minHeight: '100vh', background: '#F5F8F6', color: '#17211D', padding: 'clamp(24px, 5vw, 72px)' }}>
    <article style={{ maxWidth: 960, margin: '0 auto', background: '#fff', border: '1px solid #DCE6E1', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 60px rgba(3, 63, 45, 0.08)' }}>
      {imageURL ? <Image src={imageURL} alt={String(doc.featuredImageAlt ?? '')} width={Number(media?.width ?? 1200)} height={Number(media?.height ?? 800)} unoptimized style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 480, objectFit: 'cover' }} /> : null}
      <div style={{ padding: 'clamp(24px, 5vw, 64px)' }}>
        <Link href="/admin" style={{ display: 'inline-flex', marginBottom: 24, color: '#064B36', fontWeight: 700 }}>← Quay lại CMS</Link>
        <p style={{ color: '#A94300', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Preview đã xác thực · {String(doc._status ?? 'draft')}</p>
        <h1 style={{ color: '#064B36', fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.08, margin: '12px 0 20px' }}>{String(doc.title ?? 'Chưa có tiêu đề')}</h1>
        <p style={{ color: '#5F6E67', fontSize: 18, lineHeight: 1.7 }}>{String(doc.excerpt ?? '')}</p>
        <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #DCE6E1', whiteSpace: 'pre-wrap', fontSize: 17, lineHeight: 1.8 }}>{String(doc.body ?? '')}</div>
      </div>
    </article>
  </main>
}
