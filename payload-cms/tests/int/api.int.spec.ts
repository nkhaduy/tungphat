import { sql } from '@payloadcms/db-d1-sqlite'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let mediaID: number
let admin: { id: number; email: string; role: 'admin' }
let editor: { id: number; email: string; role: 'editor' }
const suffix = Date.now()
type TestDatabase = { drizzle: { run: (query: unknown) => Promise<unknown> } }

describe('Payload CMS thật với D1/R2 local', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await payload.create({ collection: 'users', draft: false, overrideAccess: true, data: { name: 'Admin test', email: `admin-${suffix}@example.test`, password: 'Local-test-password-123!', role: 'admin' } }) as typeof admin
    editor = await payload.create({ collection: 'users', draft: false, overrideAccess: true, data: { name: 'Editor test', email: `editor-${suffix}@example.test`, password: 'Local-test-password-123!', role: 'editor' } }) as typeof editor
    mediaID = 800000000 + (suffix % 100000000)
    await (payload.db as unknown as TestDatabase).drizzle.run(sql`INSERT INTO media (id, alt, media_kind, filename, mime_type, filesize, width, height) VALUES (${mediaID}, 'Media metadata dùng cho kiểm thử D1 local', 'brand', ${`integration-${suffix}.png`}, 'image/png', 1, 1, 1)`)
  })

  afterAll(async () => {
    if (!payload) return
    await payload.delete({ collection: 'articles', where: { slug: { contains: 'integration-' } }, overrideAccess: true })
    if (mediaID) await (payload.db as unknown as TestDatabase).drizzle.run(sql`DELETE FROM media WHERE id = ${mediaID}`)
    if (admin?.email && editor?.email) await payload.delete({ collection: 'users', where: { email: { in: [admin.email, editor.email] } }, overrideAccess: true })
  })

  it('load config với D1, R2 và content model đúng audit', async () => {
    const resolved = await config
    expect(resolved.collections.map((collection) => collection.slug)).toEqual(expect.arrayContaining([
      'users', 'media', 'products', 'articles', 'projects', 'pages', 'suppliers', 'categories',
      'material-codes', 'reviews', 'gbp-connections', 'leads', 'analytics-events', 'redirects',
    ]))
    expect(resolved.globals.map((global) => global.slug)).toEqual(expect.arrayContaining(['business-settings', 'seo-defaults', 'static-pages', 'material-categories', 'brands']))
    expect(resolved.db).toBeDefined()
    expect(resolved.plugins).toHaveLength(1)
    expect(resolved.defaultDepth).toBe(0)
    const products = resolved.collections.find((collection) => collection.slug === 'products')
    const availability = products?.fields.find((field) => 'name' in field && field.name === 'availability')
    expect(availability && 'options' in availability ? availability.options?.map((option) => typeof option === 'string' ? option : option.value) : []).toContain('guide')
  })

  it('authentication đăng nhập được và trả lỗi chung khi sai mật khẩu', async () => {
    const result = await payload.login({ collection: 'users', data: { email: admin.email, password: 'Local-test-password-123!' } })
    expect(result.user?.email).toBe(admin.email)
    await expect(payload.login({ collection: 'users', data: { email: admin.email, password: 'wrong-password' } })).rejects.toThrow()
    await expect(payload.create({ collection: 'users', draft: false, overrideAccess: false, data: { name: 'Public escalation', email: `public-${suffix}@example.test`, password: 'Local-test-password-123!', role: 'editor' } })).rejects.toThrow()
  })

  it('editor lưu draft nhưng không publish và không quản lý user', async () => {
    const slug = `integration-editor-${suffix}`
    const draft = await payload.create({ collection: 'articles', draft: true, overrideAccess: false, user: editor, data: articleData(slug, 'draft') })
    expect(draft._status).toBe('draft')
    await expect(payload.update({ collection: 'articles', id: draft.id, draft: false, overrideAccess: false, user: editor, data: { _status: 'published' } })).rejects.toMatchObject({
      message: expect.stringContaining('Biên tập viên'),
      status: 403,
    })
    await expect(payload.create({ collection: 'users', draft: false, overrideAccess: false, user: editor, data: { name: 'Không được tạo', email: `blocked-${suffix}@example.test`, password: 'Local-test-password-123!', role: 'editor' } })).rejects.toThrow()
  })

  it('admin publish và public read không trả draft', async () => {
    const publishedSlug = `integration-published-${suffix}`
    const draftSlug = `integration-private-${suffix}`
    await payload.create({ collection: 'articles', draft: false, overrideAccess: false, user: admin, data: articleData(publishedSlug, 'published') })
    await payload.create({ collection: 'articles', draft: true, overrideAccess: false, user: editor, data: articleData(draftSlug, 'draft') })
    const publicResult = await payload.find({ collection: 'articles', overrideAccess: false, where: { slug: { in: [publishedSlug, draftSlug] } } })
    expect(publicResult.docs.map((doc) => doc.slug)).toEqual([publishedSlug])
  })

  it('preview URL dùng route staging cùng origin và yêu cầu session', async () => {
    const resolved = await config
    const preview = resolved.collections.find((collection) => collection.slug === 'articles')?.admin.preview
    expect(typeof preview).toBe('function')
    const previewURL = preview as unknown as (data: { slug?: string }, options: { locale: string; req: never; token: null }) => Promise<string> | string
    expect(await previewURL({ slug: 'bai-kiem-thu' }, { locale: 'vi', req: {} as never, token: null })).toBe('http://127.0.0.1:3000/preview/articles/bai-kiem-thu')
  })

})

function articleData(slug: string, status: 'draft' | 'published') {
  return {
    title: 'Bài viết kiểm thử Payload Tùng Phát', slug, excerpt: 'Mô tả kiểm thử đủ dài để xác minh quyền lưu nháp và xuất bản trong Payload CMS local.',
    category: 'Kiểm thử', author: 'Ban kiểm thử Tùng Phát', body: '## Nội dung\n\nNội dung kiểm thử integration với Payload thật và database D1 local.',
    featuredImage: mediaID, featuredImageAlt: 'Logo Tùng Phát dùng trong bài viết kiểm thử Payload', publishedAt: '2026-07-29', legacyUpdatedAt: '2026-07-29',
    seo: { title: 'Bài kiểm thử Payload CMS cho Tùng Phát', description: 'Nội dung kiểm thử Payload CMS với quyền truy cập, bản nháp và xuất bản trên database D1 local độc lập của Tùng Phát.', canonical: `https://mdftungphat.com/bai-viet/${slug}`, noindex: false },
    _status: status,
  } as const
}
