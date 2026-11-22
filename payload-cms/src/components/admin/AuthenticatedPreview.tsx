'use client'

import { useCallback, useEffect, useRef } from 'react'

type Props = {
  collection: string
  data: Record<string, unknown>
  previewURL: string
}

export default function AuthenticatedPreview({ collection, data, previewURL }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const siteOrigin = new URL(previewURL).origin

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(message, siteOrigin)
  }, [siteOrigin])

  useEffect(() => {
    let ready = false
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== siteOrigin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type !== 'tp-preview-ready') return
      ready = true
      clearInterval(retry)
      sendMessage({ type: 'payload-live-preview', collectionSlug: collection, data })
    }
    const requestReady = () => sendMessage({ type: 'tp-preview-init' })
    const retry = window.setInterval(() => { if (!ready) requestReady() }, 300)
    window.addEventListener('message', onMessage)
    requestReady()
    return () => {
      clearInterval(retry)
      window.removeEventListener('message', onMessage)
    }
  }, [collection, data, sendMessage, siteOrigin])

  return <iframe ref={frame} src={previewURL} title="Bản xem trước nội dung Tùng Phát" onLoad={() => sendMessage({ type: 'tp-preview-init' })} className="min-h-screen w-full border-0 bg-white" />
}
