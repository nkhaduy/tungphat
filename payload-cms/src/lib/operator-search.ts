export type OperatorSearchSource = 'material-codes' | 'products' | 'articles' | 'leads'

export type OperatorSearchResult = {
  type: string
  title: string
  detail: string
  supplier?: string
  status: string
  updatedAt?: string
  href: string
}

type SearchCandidate = OperatorSearchResult & {
  code?: string
  searchableText: string
}

type SearchDocument = Record<string, unknown> & { id: string | number }

const sourceLabels: Record<OperatorSearchSource, string> = {
  'material-codes': 'Mã màu / catalogue',
  products: 'Sản phẩm / vật liệu',
  articles: 'Bài viết',
  leads: 'Khách hỏi hàng',
}

const statusLabels: Record<string, string> = {
  archived: 'Lưu trữ',
  contacted: 'Đã liên hệ',
  draft: 'Bản nháp',
  lost: 'Không tiếp tục',
  new: 'Mới',
  published: 'Đang hiển thị',
  quoted: 'Đã báo giá',
  spam: 'Spam',
  won: 'Đã chốt',
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi-VN')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeSearchCode(value: string): string {
  return normalizeSearchText(value).replace(/[^a-z0-9]/g, '')
}

export function toOperatorSearchResult(source: OperatorSearchSource, doc: SearchDocument): SearchCandidate {
  const id = encodeURIComponent(String(doc.id))
  const updatedAt = text(doc.updatedAt) || undefined

  if (source === 'material-codes') {
    const code = text(doc.code)
    const name = text(doc.name) || 'Chưa có tên mã'
    const supplier = relationName(doc.supplier)
    const category = relationName(doc.category)
    const detail = [category, text(doc.materialType), text(doc.finish)].filter(Boolean).join(' · ') || 'Chưa phân loại'
    return {
      type: sourceLabels[source],
      title: [code, name].filter(Boolean).join(' — '),
      detail,
      supplier: supplier || undefined,
      status: statusLabel(doc.status),
      updatedAt,
      href: `/admin/collections/${source}/${id}`,
      code,
      searchableText: [code, name, supplier, category, text(doc.materialType), text(doc.finish)].filter(Boolean).join(' '),
    }
  }

  if (source === 'products') {
    const title = text(doc.title) || 'Chưa có tên sản phẩm'
    const supplier = text(doc.supplier) || relationName(doc.supplier)
    return {
      type: sourceLabels[source],
      title,
      detail: [text(doc.materialType), text(doc.category)].filter(Boolean).join(' · ') || 'Chưa phân loại',
      supplier: supplier || undefined,
      status: statusLabel(doc._status),
      updatedAt,
      href: `/admin/collections/${source}/${id}`,
      searchableText: [title, text(doc.materialType), text(doc.category), supplier].filter(Boolean).join(' '),
    }
  }

  if (source === 'articles') {
    const title = text(doc.title) || 'Chưa có tiêu đề'
    return {
      type: sourceLabels[source],
      title,
      detail: text(doc.category) || 'Chưa phân loại',
      status: statusLabel(doc._status),
      updatedAt,
      href: `/admin/collections/${source}/${id}`,
      searchableText: [title, text(doc.category), text(doc.author)].filter(Boolean).join(' '),
    }
  }

  const fullName = text(doc.fullName) || 'Khách chưa ghi tên'
  const leadType = text(doc.type) === 'quote' ? 'Báo giá' : 'Liên hệ'
  const phone = text(doc.phone)
  return {
    type: sourceLabels[source],
    title: fullName,
    detail: [phone, leadType, text(doc.product), text(doc.material)].filter(Boolean).join(' · ') || leadType,
    status: statusLabel(doc.status),
    updatedAt: updatedAt || text(doc.createdAt) || undefined,
    href: `/admin/collections/${source}/${id}`,
    searchableText: [fullName, phone, leadType, text(doc.product), text(doc.material), text(doc.message)].filter(Boolean).join(' '),
  }
}

export function rankOperatorSearchResults(results: SearchCandidate[], query: string): OperatorSearchResult[] {
  const normalizedQuery = normalizeSearchText(query)
  const codeQuery = normalizeSearchCode(query)
  if (!normalizedQuery) return []

  return results
    .map((result, index) => {
      const title = normalizeSearchText(result.title)
      const searchableText = normalizeSearchText(result.searchableText)
      const code = normalizeSearchCode(result.code ?? '')
      let score = 0
      if (codeQuery && code === codeQuery) score += 1000
      if (title === normalizedQuery) score += 500
      if (title.startsWith(normalizedQuery)) score += 200
      if (searchableText.includes(normalizedQuery)) score += 50
      return { result, score, index }
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ result }) => {
      const { searchableText: _searchableText, code: _code, ...publicResult } = result
      return publicResult
    })
}

export function statusLabel(value: unknown): string {
  const status = text(value)
  return statusLabels[status] ?? (status || 'Chưa xác định')
}

function relationName(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return text((value as Record<string, unknown>).name) || text((value as Record<string, unknown>).title)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
