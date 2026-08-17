import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import './styles.css'

export default function HomePage() {
  return (
    <main className="home">
      <section className="home-card">
        <Image src="/brand/logo-horizontal.png" alt="Tùng Phát" width={328} height={86} priority />
        <p className="eyebrow">NỘI BỘ TÙNG PHÁT</p>
        <h1>Payload CMS Tùng Phát</h1>
        <p>Ứng dụng quản trị nội dung độc lập cho sản phẩm, bài viết, dự án, hình ảnh và cấu hình website.</p>
        <div className="links"><Link className="admin" href="/admin">Mở trang quản trị</Link><a href="https://mdftungphat.com" target="_blank" rel="noreferrer">Xem website ↗</a></div>
      </section>
    </main>
  )
}
