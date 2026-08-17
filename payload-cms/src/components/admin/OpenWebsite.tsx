import React from 'react'

export default function OpenWebsite() {
  return <a className="tp-open-website" href={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mdftungphat.com'} target="_blank" rel="noreferrer">Xem website ↗</a>
}

