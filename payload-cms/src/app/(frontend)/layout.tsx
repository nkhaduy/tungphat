import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Ứng dụng quản trị nội dung độc lập của Tùng Phát.',
  title: 'Payload CMS Tùng Phát',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="vi">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
