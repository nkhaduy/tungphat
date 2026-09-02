import type { CollectionConfig } from 'payload'
import { canDeleteContent, canManageContent } from '@/access/roles'
import { seoFields, stringArray } from '@/fields/common'

export const MaterialCodes: CollectionConfig = {
  slug: 'material-codes',
  labels: { singular: 'Mã màu / catalogue', plural: 'Mã màu / catalogue' },
  admin: { group: 'Sản phẩm & mã hàng', useAsTitle: 'code', defaultColumns: ['code', 'name', 'supplier', 'category', 'status'], listSearchableFields: ['code', 'name', 'slug', 'materialType', 'finish'] },
  access: { create: canManageContent, read: () => true, update: canManageContent, delete: canDeleteContent },
  fields: [
    { name: 'stableKey', label: 'Mã ổn định', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'supplier', label: 'Nhà cung cấp', type: 'relationship', relationTo: 'suppliers' as never, required: true, index: true },
    { name: 'code', label: 'Mã màu', type: 'text', required: true, index: true },
    { name: 'name', label: 'Tên mã', type: 'text', required: true },
    { name: 'slug', label: 'Đường dẫn', type: 'text', required: true, unique: true, index: true },
    { name: 'category', label: 'Nhóm vật liệu', type: 'relationship', relationTo: 'categories' as never },
    { name: 'subcategory', label: 'Phân nhóm', type: 'text' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'materialType', label: 'Loại vật liệu', type: 'text' },
    { name: 'finish', label: 'Bề mặt', type: 'text' },
    stringArray('dimensions', 'Kích thước'),
    stringArray('thicknesses', 'Độ dày'),
    { name: 'specifications', label: 'Thông số kỹ thuật', type: 'json', admin: { className: 'tp-advanced-field' } },
    { name: 'featuredImage', label: 'Ảnh đại diện', type: 'relationship', relationTo: 'media' },
    { name: 'gallery', label: 'Album ảnh', type: 'array', fields: [{ name: 'image', label: 'Ảnh', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'applicationGallery', label: 'Ảnh ứng dụng', type: 'array', fields: [{ name: 'image', label: 'Ảnh', type: 'relationship', relationTo: 'media', required: true }] },
    { name: 'sourceURL', label: 'URL nguồn', type: 'text', admin: { className: 'tp-advanced-field' } },
    { name: 'sourceID', label: 'Mã nguồn', type: 'text', admin: { className: 'tp-advanced-field' } },
    { name: 'syncChecksum', label: 'Checksum', type: 'text', index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'lastSyncedAt', label: 'Lần đồng bộ gần nhất', type: 'date', admin: { className: 'tp-advanced-field' } },
    { name: 'status', label: 'Trạng thái', type: 'select', required: true, defaultValue: 'published', options: [{ label: 'Đang hiển thị', value: 'published' }, { label: 'Bản nháp', value: 'draft' }, { label: 'Lưu trữ / không dùng', value: 'archived' }] },
    ...seoFields,
  ],
  timestamps: true,
}
