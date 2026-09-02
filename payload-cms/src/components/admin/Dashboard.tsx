import type { DashboardViewServerProps } from '@payloadcms/next/views'
import Link from 'next/link'
import React from 'react'
import type { CollectionSlug, Where } from 'payload'
import { roleOf } from '@/access/roles'
import OperatorSearch from './OperatorSearch'

type CountResponse = { totalDocs: number }
type RecentDocument = {
  id: string | number
  title?: string
  name?: string
  code?: string
  _status?: string
  status?: string
  updatedAt?: string
  createdAt?: string
}
type RecentItem = RecentDocument & { collection: string; type: string; displayTitle: string; displayStatus: string; href: string }

const recentCollections: Array<{ collection: CollectionSlug; type: string; select: Record<string, true> }> = [
  { collection: 'material-codes', type: 'Mã màu / catalogue', select: { code: true, name: true, status: true, updatedAt: true, createdAt: true } },
  { collection: 'products', type: 'Sản phẩm / vật liệu', select: { title: true, _status: true, updatedAt: true, createdAt: true } },
  { collection: 'articles', type: 'Bài viết', select: { title: true, _status: true, updatedAt: true, createdAt: true } },
  { collection: 'projects', type: 'Dự án CNC', select: { title: true, _status: true, updatedAt: true, createdAt: true } },
  { collection: 'pages', type: 'Trang dịch vụ CNC', select: { title: true, _status: true, updatedAt: true, createdAt: true } },
]

export default async function Dashboard(props: DashboardViewServerProps) {
  const user = props.user as { name?: string; role?: string } | undefined
  const role = roleOf(props.initPageResult.req)
  let dashboardData: { newLeads: number; draftArticles: number; publishedProducts: number; publishedMaterialCodes: number; archivedMaterialCodes: number; recent: RecentItem[] } | undefined

  try {
    const [newLeads, draftArticles, publishedProducts, publishedMaterialCodes, archivedMaterialCodes, ...recentResults] = await Promise.all([
      countCollection(props, 'leads', { status: { equals: 'new' } }),
      countCollection(props, 'articles', { _status: { equals: 'draft' } }),
      countCollection(props, 'products', { _status: { equals: 'published' } }),
      countCollection(props, 'material-codes', { status: { equals: 'published' } }),
      countCollection(props, 'material-codes', { status: { equals: 'archived' } }),
      ...recentCollections.map(({ collection, select }) => findRecent(props, collection, select)),
    ])

    const recent = recentResults.flatMap((result, index) => recentCollections[index].type ? result.docs.map((doc) => recentItem(doc, recentCollections[index])) : [])
      .sort((left, right) => String(right.updatedAt ?? right.createdAt ?? '').localeCompare(String(left.updatedAt ?? left.createdAt ?? '')))
      .slice(0, 6)
    dashboardData = { newLeads, draftArticles, publishedProducts, publishedMaterialCodes, archivedMaterialCodes, recent }
  } catch {
    dashboardData = undefined
  }

  if (!dashboardData) {
    return <main className="tp-dashboard tp-dashboard-error" role="alert"><h1>Không tải được tổng quan</h1><p>Đã có lỗi khi đọc dữ liệu CMS. Vui lòng thử tải lại trang.</p><Link href="/admin">Thử lại</Link></main>
  }

  const actions = [
    { href: '#tp-search', label: 'Tìm mã màu', visible: true },
    { href: '/admin/collections/material-codes/create', label: 'Thêm mã màu', visible: canCreate(props, 'material-codes', role) },
    { href: '/admin/collections/products/create', label: 'Thêm sản phẩm', visible: canCreate(props, 'products', role) },
    { href: '/admin/collections/articles/create', label: role === 'editor' ? 'Soạn bài viết' : 'Đăng bài', visible: canCreate(props, 'articles', role) },
    { href: '/admin/collections/leads', label: 'Xem khách hỏi', visible: canRead(props, 'leads', role) },
    { href: '/admin/globals/business-settings', label: 'Sửa liên hệ', visible: canUpdateGlobal(props, 'business-settings', role) },
  ].filter((action) => action.visible)

  const cards = [
    { label: 'Khách hỏi mới', value: dashboardData.newLeads, detail: 'Mở danh sách khách đang chờ liên hệ.', href: '/admin/collections/leads?where%5Bstatus%5D%5Bequals%5D=new', tone: 'orange' },
    { label: 'Bài viết bản nháp', value: dashboardData.draftArticles, detail: 'Bài viết chưa hiển thị trên website.', href: '/admin/collections/articles?where%5B_status%5D%5Bequals%5D=draft', tone: 'soft' },
    { label: 'Sản phẩm đang hiển thị', value: dashboardData.publishedProducts, detail: 'Sản phẩm đã được hiển thị trên website.', href: '/admin/collections/products?where%5B_status%5D%5Bequals%5D=published', tone: 'forest' },
    { label: 'Mã màu đang hiển thị', value: dashboardData.publishedMaterialCodes, detail: 'Mã màu có thể tra cứu trong catalogue.', href: '/admin/collections/material-codes?where%5Bstatus%5D%5Bequals%5D=published', tone: 'soft' },
    { label: 'Mã màu lưu trữ', value: dashboardData.archivedMaterialCodes, detail: 'Mã không còn dùng trong vận hành thường ngày.', href: '/admin/collections/material-codes?where%5Bstatus%5D%5Bequals%5D=archived', tone: 'muted' },
  ]

  return (
    <main className="tp-dashboard" aria-labelledby="tp-dashboard-title">
      <header className="tp-dashboard-hero">
        <div><h1 id="tp-dashboard-title">Xin chào{user?.name ? `, ${user.name}` : ''}</h1><p>Chọn một việc để bắt đầu quản lý nội dung Tùng Phát.</p></div>
      </header>

      <section className="tp-search-section" aria-labelledby="tp-search-title">
        <div><h2 id="tp-search-title">Tìm mọi thứ</h2><p>Mã màu, sản phẩm, bài viết hoặc khách hỏi hàng đều có thể tìm từ đây.</p></div>
        <OperatorSearch />
      </section>

      <section className="tp-task-section" aria-labelledby="tp-task-title">
        <div className="tp-section-heading"><div><h2 id="tp-task-title">Việc cần xử lý</h2><p>Các con số dưới đây đều mở đúng danh sách để bạn xem tiếp.</p></div></div>
        <div className="tp-task-grid">
          {cards.map((card) => <Link className={`tp-task-card tp-task-card--${card.tone}`} href={card.href} key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small><b>Mở danh sách</b></Link>)}
        </div>
      </section>

      <section className="tp-quick-section" aria-labelledby="tp-quick-title">
        <div className="tp-section-heading"><div><h2 id="tp-quick-title">Thao tác nhanh</h2><p>Những việc thường làm nhất trong ngày.</p></div></div>
        <div className="tp-quick-actions">{actions.map((action, index) => <Link className={index === 0 ? 'is-primary' : ''} href={action.href} key={action.href}>{action.label}</Link>)}</div>
      </section>

      <section className="tp-recent-section" aria-labelledby="tp-recent-title">
        <div className="tp-section-heading"><div><h2 id="tp-recent-title">Sửa gần đây</h2><p>Mở lại một nội dung vừa chỉnh sửa.</p></div><span>{dashboardData.recent.length} mục</span></div>
        {dashboardData.recent.length ? <ul className="tp-recent-list">{dashboardData.recent.map((item) => <li key={`${item.collection}-${item.id}`}><Link href={item.href}><span className="tp-recent-list__type">{item.type}</span><strong>{item.displayTitle}</strong><small>{item.displayStatus} · {formatDate(item.updatedAt ?? item.createdAt)}</small></Link></li>)}</ul> : <div className="tp-empty-state"><strong>Chưa có nội dung gần đây</strong><span>Bạn có thể bắt đầu từ một thao tác nhanh ở phía trên.</span></div>}
      </section>
    </main>
  )
}

async function countCollection(props: DashboardViewServerProps, collection: CollectionSlug, where: Where): Promise<number> {
  const result = await props.payload.count({ collection, where, req: props.initPageResult.req, overrideAccess: false }) as CountResponse
  return result.totalDocs
}

async function findRecent(props: DashboardViewServerProps, collection: CollectionSlug, select: Record<string, true>) {
  return props.payload.find({ collection, limit: 4, depth: 0, sort: '-updatedAt', select, req: props.initPageResult.req, overrideAccess: false }) as Promise<{ docs: RecentDocument[] }>
}

function recentItem(doc: RecentDocument, meta: { collection: CollectionSlug; type: string }): RecentItem {
  const displayTitle = meta.collection === 'material-codes' ? [doc.code, doc.name].filter(Boolean).join(' — ') || 'Mã màu chưa có tên' : doc.title || 'Nội dung chưa có tiêu đề'
  const status = doc.status || doc._status
  return { ...doc, collection: meta.collection, type: meta.type, displayTitle, displayStatus: status === 'published' ? 'Đang hiển thị' : status === 'draft' ? 'Bản nháp' : status === 'archived' ? 'Lưu trữ' : 'Chưa xác định', href: `/admin/collections/${meta.collection}/${encodeURIComponent(String(doc.id))}` }
}

function formatDate(value?: string) {
  if (!value) return 'Chưa có ngày cập nhật'
  return new Date(value).toLocaleDateString('vi-VN')
}

function canRead(props: DashboardViewServerProps, collection: CollectionSlug, role: ReturnType<typeof roleOf>) {
  return permission(props, 'collections', collection, 'read') ?? Boolean(role)
}

function canCreate(props: DashboardViewServerProps, collection: CollectionSlug, role: ReturnType<typeof roleOf>) {
  return permission(props, 'collections', collection, 'create') ?? Boolean(role)
}

function canUpdateGlobal(props: DashboardViewServerProps, global: string, role: ReturnType<typeof roleOf>) {
  return permission(props, 'globals', global, 'update') ?? Boolean(role)
}

function permission(props: DashboardViewServerProps, scope: 'collections' | 'globals', slug: string, action: string): boolean | undefined {
  const scopePermissions = props.permissions?.[scope] as Record<string, Record<string, unknown>> | undefined
  const entity = scopePermissions?.[slug]
  if (!entity) return undefined
  return Boolean(entity[action])
}
