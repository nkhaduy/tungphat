import Link from 'next/link'
import React from 'react'

export default function OperatorNavHome() {
  return <div className="tp-nav-editorial-shortcuts" aria-label="Lối tắt nội dung">
    <Link className="nav__link tp-nav-home-link" href="/admin" id="nav-dashboard">Tổng quan</Link>
    <Link className="nav__link tp-nav-editorial-link" href="/admin/collections/articles">Tất cả bài viết</Link>
    <Link className="nav__link tp-nav-editorial-link" href="/admin/collections/articles/create">Viết bài mới</Link>
    <Link className="nav__link tp-nav-editorial-link" href="/admin/collections/articles?where%5B_status%5D%5Bequals%5D=draft">Bài nháp</Link>
    <Link className="nav__link tp-nav-editorial-link" href="/admin/collections/categories">Danh mục</Link>
    <Link className="nav__link tp-nav-editorial-link" href="/admin/collections/media">Thư viện ảnh</Link>
  </div>
}
