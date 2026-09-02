'use client'

import React, { useEffect, useRef, useState } from 'react'

type SearchResult = {
  type: string
  title: string
  detail: string
  supplier?: string
  status: string
  updatedAt?: string
  href: string
}

export default function OperatorSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [settledQuery, setSettledQuery] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('search_failed')
        const body = await response.json() as { results?: SearchResult[] }
        setResults(body.results ?? [])
        setSettledQuery(trimmed)
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setResults([])
        setError('Không tìm được dữ liệu lúc này. Vui lòng thử lại.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Enter' && results[0]) {
      event.preventDefault()
      window.location.assign(results[0].href)
    }
  }

  const normalizedQuery = query.trim()
  const queryReady = normalizedQuery.length >= 2
  const showPanel = open && queryReady
  const visibleResults = settledQuery === normalizedQuery ? results : []

  return (
    <div className="tp-search" id="tp-search">
      <div className="tp-search__input-wrap">
        <label className="tp-sr-only" htmlFor="tp-global-search">Tìm mọi thứ</label>
        <input
          ref={inputRef}
          id="tp-global-search"
          className="tp-search__input"
          type="search"
          placeholder="Ví dụ: 301, Artistic Stripe, MDF, tên khách..."
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-controls="tp-search-results"
          aria-expanded={showPanel}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            setOpen(nextQuery.trim().length >= 2)
          }}
          onFocus={() => setOpen(query.trim().length >= 2)}
          onKeyDown={handleKeyDown}
        />
        {loading ? <span className="tp-search__status" role="status">Đang tìm...</span> : null}
      </div>
      {showPanel ? (
        <div className="tp-search__panel" id="tp-search-results" role="listbox" aria-label="Kết quả tìm kiếm">
          {error ? <p className="tp-search__message" role="alert">{error}</p> : null}
          {!loading && !error && visibleResults.length === 0 ? <p className="tp-search__message">Chưa có kết quả. Thử mã 301, tên nhà cung cấp, tên khách hoặc số điện thoại.</p> : null}
          {visibleResults.map((result) => (
            <a className="tp-search-result" href={result.href} key={`${result.href}-${result.title}`} role="option" aria-selected="false">
              <span className="tp-search-result__type">{result.type}</span>
              <strong>{result.title}</strong>
              <span>{result.supplier ? `${result.supplier} · ` : ''}{result.detail}</span>
              <small>{result.status}</small>
            </a>
          ))}
        </div>
      ) : null}
      <p className="tp-search__hint">Tìm không phân biệt hoa thường và dấu tiếng Việt. Nhấn Enter để mở kết quả đầu tiên.</p>
    </div>
  )
}
