'use client'

import React, { useCallback, useEffect, useState } from 'react'

type BuildSummary = {
  status: 'queued' | 'building' | 'deploying' | 'live' | 'failed'
  branch: string
  commitSha?: string
  articleSlug?: string
  triggerReason?: string
  errorCode?: string
  createdAt: string
  completedAt?: string
  buildId?: string
}

type StatusResponse = { build: BuildSummary | null; canRetry: boolean; targetLabel: 'preview' | 'website' }

export default function SiteBuildStatus() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/site-build/status', { credentials: 'same-origin', cache: 'no-store' })
      if (!response.ok) throw new Error('Không đọc được trạng thái bản dựng.')
      setData(await response.json() as StatusResponse)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được trạng thái bản dựng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => void refresh(), 12_000)
    return () => { window.clearTimeout(initial); window.clearInterval(timer) }
  }, [refresh])

  async function retry() {
    setRetrying(true)
    setMessage('')
    try {
      const response = await fetch('/api/site-build/retry', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      if (!response.ok) throw new Error(response.status === 409 ? 'Không có bản dựng lỗi để thử lại.' : 'Gửi yêu cầu thử lại không thành công.')
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gửi yêu cầu thử lại không thành công.')
    } finally {
      setRetrying(false)
    }
  }

  const build = data?.build
  const targetName = data?.targetLabel === 'preview' ? 'bản preview' : 'website'
  return (
    <section className="tp-publish-build" aria-label="Trạng thái cập nhật website" aria-live="polite">
      <div className="tp-publish-build__heading"><strong>Cập nhật website</strong><span className={`tp-publish-build__state tp-publish-build__state--${build?.status ?? 'idle'}`}>
        {loading ? 'Đang tải' : build ? statusLabel(build.status) : 'Chưa có lần đăng'}
      </span></div>
      {build && <>
        <p>{build.status === 'live' ? `${targetName === 'bản preview' ? 'Bản preview' : 'Website'} đã xác nhận phục vụ nội dung mới.` : build.status === 'failed' ? failureLabel(build.errorCode, targetName) : `Cloudflare đang cập nhật ${targetName}.`}</p>
        <small>{formatDate(build.createdAt)}{build.commitSha ? ` · ${build.commitSha.slice(0, 8)}` : ''}</small>
      </>}
      {message && <p className="tp-publish-build__error" role="alert">{message}</p>}
      {build?.status === 'failed' && data?.canRetry && <button type="button" onClick={() => void retry()} disabled={retrying}>
        {retrying ? 'Đang gửi…' : 'Thử build lại'}
      </button>}
      <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages/builds" target="_blank" rel="noreferrer">Mở nhật ký Workers Builds</a>
    </section>
  )
}

function statusLabel(status: BuildSummary['status']) {
  return ({ queued: 'Đang chờ', building: 'Đang build', deploying: 'Đang triển khai', live: 'Đã cập nhật', failed: 'Thất bại' } as const)[status]
}

function failureLabel(code: string | undefined, targetName: string) {
  return ({
    artifact_validation: `Bài viết chưa hợp lệ trong gói build. ${targetName === 'bản preview' ? 'Bản preview' : 'Website'} trước vẫn được giữ.`,
    deploy_failed: `Cloudflare không triển khai được. ${targetName === 'bản preview' ? 'Bản preview' : 'Website'} trước vẫn hoạt động.`,
    preview_probe_failed: `Chưa xác nhận được ${targetName} mới. Hãy kiểm tra nhật ký build.`,
    payload_unavailable: 'Không đọc được nội dung từ CMS staging.',
    hook_not_configured: 'Deploy Hook chưa được cấu hình cho môi trường preview.',
    hook_invalid: 'Deploy Hook cấu hình không hợp lệ.',
    trigger_failed: 'Cloudflare chưa nhận yêu cầu build.',
    callback_timeout: 'Build quá thời gian phản hồi. Website trước vẫn hoạt động; có thể thử lại an toàn.',
  } as Record<string, string>)[code ?? ''] || 'Bản dựng lỗi. Mở nhật ký Workers Builds để xem chi tiết.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}
