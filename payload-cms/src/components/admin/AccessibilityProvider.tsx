'use client'

import React, { useEffect } from 'react'

type Props = {
  children?: React.ReactNode
}

export default function AccessibilityProvider({ children }: Props) {
  useEffect(() => {
    let activeDialog: HTMLDialogElement | null = null
    let previousFocus: HTMLElement | null = null

    const labelDocumentMenus = () => {
      document.querySelectorAll<HTMLButtonElement>('.doc-controls__popup > .popup__trigger-wrap > button:not([aria-label])').forEach((button) => {
        button.setAttribute('aria-label', 'Tùy chọn tài liệu')
        button.setAttribute('title', 'Tùy chọn tài liệu')
      })

      document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][aria-label=""], input[type="checkbox"]:not([aria-label])').forEach((input) => {
        const label = input.id === 'select-all' ? 'Chọn tất cả' : input.closest('label')?.textContent?.trim() || 'Chọn mục'
        input.setAttribute('aria-label', label)
      })

      document.querySelectorAll<HTMLButtonElement>('.clipboard-action__popup .popup-button:not([aria-label])').forEach((button) => {
        button.setAttribute('aria-label', 'Sao chép mục')
        button.setAttribute('title', 'Sao chép mục')
      })

      document.querySelectorAll<HTMLButtonElement>('.dropdown-indicator[aria-hidden="true"]').forEach((button) => {
        button.removeAttribute('aria-hidden')
        button.setAttribute('aria-label', 'Mở danh sách')
        button.setAttribute('title', 'Mở danh sách')
      })

      document.querySelectorAll<HTMLElement>('.clear-indicator[aria-hidden="true"]').forEach((button) => {
        button.removeAttribute('aria-hidden')
        button.setAttribute('aria-label', 'Xóa lựa chọn')
        button.setAttribute('title', 'Xóa lựa chọn')
      })

      document.querySelectorAll<HTMLElement>('.collapsible__drag[role="button"]:not([aria-label])').forEach((handle) => {
        handle.setAttribute('aria-label', 'Kéo để sắp xếp mục')
        handle.setAttribute('title', 'Kéo để sắp xếp mục')
      })

      document.querySelectorAll<HTMLButtonElement>('.array-actions__button:not([aria-label])').forEach((button) => {
        button.setAttribute('aria-label', 'Tùy chọn mục')
        button.setAttribute('title', 'Tùy chọn mục')
      })

      document.querySelectorAll<HTMLButtonElement>('.date-time-picker__clear-button:not([aria-label])').forEach((button) => {
        button.setAttribute('aria-label', 'Xóa ngày')
        button.setAttribute('title', 'Xóa ngày')
      })

      document.querySelectorAll<HTMLElement>('.doc-tabs__tabs').forEach((tabList) => {
        tabList.setAttribute('role', 'tablist')
        tabList.setAttribute('aria-label', 'Các chế độ tài liệu')
        tabList.querySelectorAll<HTMLElement>('.doc-tab').forEach((tab) => {
          tab.setAttribute('role', 'tab')
          tab.setAttribute('aria-selected', tab.classList.contains('doc-tab--active') ? 'true' : 'false')
        })
      })

      document.querySelectorAll<HTMLInputElement>('.rs__input:not([aria-label]), .date-time-picker input[type="text"]:not([aria-label]), input[type="text"]:disabled:not([aria-label])').forEach((input) => {
        const field = input.closest('[id^="field-"]')?.id.replace(/^field-/, '')
        const labels: Record<string, string> = {
          legacyUpdatedAt: 'Ngày cập nhật cũ',
          publishedAt: 'Ngày xuất bản',
        }
        input.setAttribute('aria-label', labels[field || ''] || (field ? `Chọn ${field}` : 'Giá trị chỉ đọc'))
      })

      const openDialog = document.querySelector<HTMLDialogElement>('dialog[open]')
      if (openDialog && openDialog !== activeDialog) {
        const currentFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        previousFocus = currentFocus?.closest('.popup')?.querySelector<HTMLElement>(':scope > .popup__trigger-wrap > button')
          ?? (currentFocus?.id === 'action-delete' ? document.querySelector<HTMLElement>('.doc-controls__popup .popup__trigger-wrap > button') : null)
          ?? currentFocus
        activeDialog = openDialog
        window.setTimeout(() => {
          const firstControl = openDialog.querySelector<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
          firstControl?.focus()
        })
      } else if (!openDialog && activeDialog) {
        activeDialog = null
        const focusTarget = previousFocus
        previousFocus = null
        focusTarget?.focus()
      }
    }

    const trapDialogFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !activeDialog) return
      const controls = [...activeDialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null)
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    labelDocumentMenus()
    let settleTimer = 0
    const observer = new MutationObserver(() => {
      labelDocumentMenus()
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(labelDocumentMenus, 200)
    })
    observer.observe(document.body, { attributeFilter: ['open'], attributes: true, childList: true, subtree: true })
    document.addEventListener('keydown', trapDialogFocus)
    const timers = [50, 150, 350, 750, 1500].map((delay) => window.setTimeout(labelDocumentMenus, delay))
    return () => {
      observer.disconnect()
      document.removeEventListener('keydown', trapDialogFocus)
      window.clearTimeout(settleTimer)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  return children
}
