import type { DashboardViewServerProps } from '@payloadcms/next/views'
import Link from 'next/link'
import React from 'react'
import type { CollectionSlug, Where } from 'payload'
import { roleOf } from '@/access/roles'

type CountResult = { totalDocs: number; docs: Array<{ id: string | number; title?: string; updatedAt?: string; createdAt?: string; _status?: string }> }

async function findCount(props: DashboardViewServerProps, collection: CollectionSlug, where?: Where, includeDocs = true): Promise<CountResult> {
  return props.payload.find({
    collection,
    limit: includeDocs ? 5 : 0,
    depth: 0,
    sort: '-updatedAt',
    where,
    select: includeDocs ? { title: true, updatedAt: true } : undefined,
    req: props.initPageResult.req,
    overrideAccess: false,
  }) as Promise<CountResult>
}

export default async function Dashboard(props: DashboardViewServerProps) {
  const user = props.user as { name?: string; email?: string; role?: string } | undefined
  const role = roleOf(props.initPageResult.req)
  let dashboardData: {
    totalContent: number
    media: CountResult
    drafts: CountResult
    recent: CountResult['docs']
  } | undefined
  try {
    const [products, articles, projects, pages, media, drafts] = await Promise.all([
      findCount(props, 'products'), findCount(props, 'articles'), findCount(props, 'projects'), findCount(props, 'pages'), findCount(props, 'media', undefined, false),
      findCount(props, 'articles', { _status: { equals: 'draft' } }, false),
    ])
    dashboardData = {
      totalContent: products.totalDocs + articles.totalDocs + projects.totalDocs + pages.totalDocs,
      media,
      drafts,
      recent: [...articles.docs, ...products.docs, ...projects.docs, ...pages.docs]
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .slice(0, 6),
    }
  } catch {
    dashboardData = undefined
  }

  if (!dashboardData) {
    return <main className="tp-dashboard tp-dashboard-error" role="alert"><h1>Không tải được tổng quan</h1><p>Đã có lỗi khi đọc dữ liệu CMS. Vui lòng thử tải lại trang.</p><Link href="/admin">Thử lại</Link></main>
  }

  const { totalContent, media, drafts, recent } = dashboardData
  return (
      <main className="tp-dashboard" aria-labelledby="tp-dashboard-title">
        <header className="tp-dashboard-hero">
          <div><p className="tp-eyebrow">TỔNG QUAN</p><h1 id="tp-dashboard-title">Xin chào{user?.name ? `, ${user.name}` : ''}</h1><p>Không gian quản trị nội dung sáng gọn cho đội ngũ Tùng Phát.</p></div>
          <a className="tp-dashboard-primary" href={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mdftungphat.com'} target="_blank" rel="noreferrer">Mở website ↗</a>
        </header>
        <section className="tp-quick-actions" aria-label="Thao tác nhanh">
          <Link href="/admin/collections/articles/create">+ Tạo bài viết</Link><Link href="/admin/collections/products/create">+ Thêm sản phẩm</Link><Link href="/admin/collections/media/create">+ Upload hình ảnh</Link><Link href="/admin/globals/business-settings">Chỉnh thông tin liên hệ</Link>
        </section>
        <section className="tp-stat-grid" aria-label="Tóm tắt nội dung">
          <div className="tp-stat"><span>Nội dung public</span><strong>{totalContent}</strong><small>Products, bài viết, dự án và trang</small></div>
          <div className="tp-stat"><span>Media</span><strong>{media.totalDocs}</strong><small>Tệp trong Media library</small></div>
          <div className="tp-stat"><span>Draft bài viết</span><strong>{drafts.totalDocs}</strong><small>Không xuất hiện trên website</small></div>
          <div className="tp-stat"><span>Vai trò</span><strong>{role === 'super-admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Editor'}</strong><small>Quyền hiện tại của tài khoản</small></div>
        </section>
        <section className="tp-dashboard-columns"><div className="tp-dashboard-panel"><div className="tp-panel-heading"><h2>Sửa gần đây</h2><span>{recent.length} mục</span></div>{recent.length ? <ul className="tp-recent-list">{recent.map((item) => <li key={`${item.id}-${item.title}`}><span>{item.title ?? 'Chưa có tiêu đề'}</span><small>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '—'}</small></li>)}</ul> : <div className="tp-empty-state"><strong>Chưa có nội dung</strong><span>Tạo bản ghi đầu tiên từ một thao tác nhanh.</span></div>}</div><div className="tp-dashboard-panel"><div className="tp-panel-heading"><h2>Trạng thái hệ thống</h2><span>Production</span></div><div className="tp-system-state"><span className="tp-status-dot" />Payload đang dùng D1 và R2 production.<small>Nội dung, leads, analytics và reviews cùng nằm trong Payload.</small></div></div></section>
      </main>
    )
}
