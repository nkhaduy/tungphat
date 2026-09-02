'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

type Props = { canUseAdvanced: boolean }
type AdminMode = 'simple' | 'advanced'

export default function ModeSwitcherClient({ canUseAdvanced }: Props) {
  const [mode, setMode] = useState<AdminMode>('simple')
  const activeModeRef = useRef<AdminMode>('simple')

  useLayoutEffect(() => {
    let activeMode: AdminMode = 'simple'
    try {
      const stored = window.localStorage.getItem('tp-admin-mode')
      if (canUseAdvanced && stored === 'advanced') activeMode = 'advanced'
    } catch {
      activeMode = 'simple'
    }

    activeModeRef.current = activeMode
    const applyMode = () => applyAdminMode(activeModeRef.current)

    const observer = new MutationObserver(applyMode)
    observer.observe(document.body, { childList: true, subtree: true })
    applyMode()
    window.setTimeout(() => setMode(activeMode), 0)
    return () => observer.disconnect()
  }, [canUseAdvanced])

  const changeMode = (nextMode: AdminMode) => {
    if (nextMode === 'advanced' && !canUseAdvanced) return
    activeModeRef.current = nextMode
    setMode(nextMode)
    applyAdminMode(nextMode)
    try {
      window.localStorage.setItem('tp-admin-mode', nextMode)
    } catch {
      // Keep the session usable when storage is unavailable.
    }
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

function applyAdminMode(mode: AdminMode) {
  document.documentElement.dataset.tpAdminMode = mode
  document.body.dataset.tpAdminMode = mode
  document.querySelectorAll<HTMLElement>('.nav-group').forEach((group) => {
    const label = group.querySelector('.nav-group__label')?.textContent?.trim()
    if (label === 'Quản trị hệ thống') group.hidden = mode === 'simple'
  })
}
