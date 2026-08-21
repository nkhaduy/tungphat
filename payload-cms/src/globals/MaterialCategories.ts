import type { GlobalConfig } from 'payload'
import { contentGlobalAccess } from './access'
import { slugField, vietnameseText } from '@/fields/common'

export const MaterialCategories: GlobalConfig = {
  slug: 'material-categories', label: 'Nhóm vật liệu', access: contentGlobalAccess,
  admin: { group: 'Sản phẩm và dịch vụ', description: 'Danh mục vật liệu đang dùng cho điều hướng và phân nhóm website.' },
  fields: [
    vietnameseText('title', 'Tiêu đề', { required: true, minLength: 2, maxLength: 120 }),
    { name: 'items', label: 'Danh mục', type: 'array', required: true, minRows: 1, fields: [vietnameseText('name', 'Tên', { required: true }), slugField(false)] },
  ],
}

