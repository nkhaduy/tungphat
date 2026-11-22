import type { Block } from 'payload'

const safeLink = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim() || value.startsWith('//')) return 'Nhập URL hợp lệ.'
  if (/^(?:\/|#)/u.test(value)) return true
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol) || 'Chỉ hỗ trợ liên kết HTTP(S), email, điện thoại hoặc đường dẫn nội bộ.'
  } catch {
    return 'Nhập URL hợp lệ.'
  }
}

const editorialTable: Block = {
  slug: 'editorialTable',
  labels: { singular: 'Bảng nội dung', plural: 'Bảng nội dung' },
  fields: [
    { name: 'caption', label: 'Chú thích bảng', type: 'text', maxLength: 160 },
    { name: 'columns', label: 'Cột', type: 'array', minRows: 1, maxRows: 6, fields: [
      { name: 'label', label: 'Tên cột', type: 'text', required: true, maxLength: 100 },
    ] },
    { name: 'rows', label: 'Hàng', type: 'array', minRows: 1, maxRows: 40, fields: [
      { name: 'cells', label: 'Ô trong hàng', type: 'array', minRows: 1, maxRows: 6, fields: [
        { name: 'value', label: 'Nội dung ô', type: 'textarea', maxLength: 800 },
      ] },
    ] },
  ],
}

const editorialCode: Block = {
  slug: 'editorialCode',
  labels: { singular: 'Mã / đoạn kỹ thuật', plural: 'Mã / đoạn kỹ thuật' },
  fields: [
    { name: 'language', label: 'Ngôn ngữ', type: 'select', defaultValue: 'text', options: [
      { label: 'Văn bản', value: 'text' }, { label: 'HTML', value: 'html' }, { label: 'CSS', value: 'css' }, { label: 'JavaScript', value: 'javascript' }, { label: 'JSON', value: 'json' },
    ] },
    { name: 'code', label: 'Nội dung mã', type: 'textarea', required: true, maxLength: 12_000, admin: { rows: 10 } },
  ],
}

const editorialCTA: Block = {
  slug: 'editorialCTA',
  labels: { singular: 'Nút / liên kết kêu gọi', plural: 'Nút / liên kết kêu gọi' },
  fields: [
    { name: 'title', label: 'Tiêu đề', type: 'text', maxLength: 140 },
    { name: 'description', label: 'Mô tả', type: 'textarea', maxLength: 400 },
    { name: 'label', label: 'Nhãn nút', type: 'text', required: true, defaultValue: 'Tìm hiểu thêm', maxLength: 80 },
    { name: 'href', label: 'Đường dẫn', type: 'text', required: true, validate: safeLink, maxLength: 500 },
  ],
}

const editorialFAQ: Block = {
  slug: 'editorialFAQ',
  labels: { singular: 'Câu hỏi và trả lời', plural: 'Câu hỏi và trả lời' },
  fields: [
    { name: 'items', label: 'Câu hỏi', type: 'array', minRows: 1, maxRows: 20, fields: [
      { name: 'question', label: 'Câu hỏi', type: 'text', required: true, maxLength: 240 },
      { name: 'answer', label: 'Câu trả lời', type: 'textarea', required: true, maxLength: 1_500 },
    ] },
  ],
}

const editorialGallery: Block = {
  slug: 'editorialGallery',
  labels: { singular: 'Thư viện ảnh', plural: 'Thư viện ảnh' },
  fields: [
    { name: 'images', label: 'Ảnh từ thư viện', type: 'array', minRows: 1, maxRows: 12, fields: [
      { name: 'image', label: 'Ảnh', type: 'upload', relationTo: 'media', required: true },
      { name: 'caption', label: 'Chú thích', type: 'text', maxLength: 180 },
    ] },
  ],
}

const editorialVideo: Block = {
  slug: 'editorialVideo',
  labels: { singular: 'Video YouTube', plural: 'Video YouTube' },
  fields: [
    { name: 'title', label: 'Tiêu đề video', type: 'text', required: true, maxLength: 120 },
    { name: 'url', label: 'URL YouTube', type: 'text', required: true, maxLength: 500, validate: (value: unknown) => {
      if (typeof value !== 'string') return 'Nhập URL video YouTube.'
      try {
        const url = new URL(value)
        return url.protocol === 'https:' && ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname) || 'Chỉ hỗ trợ video YouTube dùng HTTPS.'
      } catch {
        return 'Nhập URL video YouTube.'
      }
    } },
  ],
}

export const articleEditorialBlocks: Block[] = [editorialTable, editorialCode, editorialCTA, editorialFAQ, editorialGallery, editorialVideo]
