import React from 'react'
import Image from 'next/image'

export function Logo() {
  return <Image className="tp-admin-logo" src="/brand/logo-horizontal.png" alt="Tùng Phát" width={328} height={86} priority />
}

export function Icon() {
  return <Image className="tp-admin-icon" src="/brand/logo-horizontal.png" alt="" width={64} height={64} aria-hidden="true" />
}
