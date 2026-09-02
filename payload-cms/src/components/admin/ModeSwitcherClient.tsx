'use client'

import React, { useLayoutEffect, useState } from 'react'

type Props = { canUseAdvanced: boolean }
type AdminMode = 'simple' | 'advanced'

export default function ModeSwitcherClient({ canUseAdvanced }: Props) {
  const [mode, setMode] = useState<AdminMode>('simple')

  useLayoutEffect(() => {
    let activeMode: AdminMode = 'simple'
    try {
      const stored = window.localStorage.getItem('tp-admin-mode')
      if (canUseAdvanced && stored === 'advanced') activeMode = 'advanced'
    } catch {
      activeMode = 'simple'
    }

    const applyMode = () => {
      document.documentElement.dataset.tpAdminMode = activeMode
      document.body.dataset.tpAdminMode = activeMode
      document.querySelectorAll<HTMLElement>('.nav-group').forEach((group) => {
        const label = group.querySelector('.nav-group__label')?.textContent?.trim()
        if (label === 'Quản trị hệ thống') group.hidden = activeMode === 'simple'
      })
    }

    const observer = new MutationObserver(applyMode)
    observer.observe(document.body, { childList: true, subtree: true })
    applyMode()
    window.setTimeout(() => setMode(activeMode), 0)
    return () => observer.disconnect()
  }, [canUseAdvanced])

  const changeMode = (nextMode: AdminMode) => {
    if (nextMode === 'advanced' && !canUseAdvanced) return
    setMode(nextMode)
    document.documentElement.dataset.tpAdminMode = nextMode
    document.body.dataset.tpAdminMode = nextMode
    try {
      window.localStorage.setItem('tp-admin-mode', nextMode)
    } catch {
      // Keep the session usable when storage is unavailable.
    }
    document.querySelectorAll<HTMLElement>('.nav-group').forEach((group) => {
      const label = group.querySelector('.nav-group__label')?.textContent?.trim()
      if (label === 'Quản trị hệ thống') group.hidden = nextMode === 'simple'
    })
  }

  return (
    <aside className="tp-mode-switcher" aria-label="Chế độ làm việc">
      <div>
        <strong>Chế độ làm việc</strong>
        <span>{mode === 'simple' ? 'Đang ở chế độ đơn giản' : 'Đang ở chế độ nâng cao'}</span>
      </div>
      {canUseAdvanced ? (
        <div className="tp-mode-switcher__buttons" role="group" aria-label="Chọn chế độ">
          <button type="button" className={mode === 'simple' ? 'is-active' : ''} aria-pressed={mode === 'simple'} onClick={() => changeMode('simple')}>Đơn giản</button>
          <button type="button" className={mode === 'advanced' ? 'is-active' : ''} aria-pressed={mode === 'advanced'} onClick={() => changeMode('advanced')}>Nâng cao</button>
        </div>
      ) : null}
      {canUseAdvanced ? <small>Mục kỹ thuật chỉ hiện khi chọn Nâng cao.</small> : null}
    </aside>
  )
}
