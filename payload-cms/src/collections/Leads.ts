import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/roles'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Khách hỏi hàng', plural: 'Khách hỏi hàng' },
  admin: { group: 'Khách hỏi hàng', useAsTitle: 'fullName', defaultColumns: ['fullName', 'phone', 'type', 'status', 'createdAt'] },
  access: { create: () => true, read: canManageContent, update: canManageContent, delete: () => false },
  fields: [
    { name: 'legacyID', label: 'Mã cũ', type: 'text', unique: true, index: true, admin: { readOnly: true, className: 'tp-advanced-field' } },
    { name: 'submissionKey', label: 'Mã phiên gửi', type: 'text', required: true, unique: true, index: true, admin: { className: 'tp-advanced-field' } },
    { name: 'type', label: 'Nhu cầu', type: 'select', required: true, options: [{ label: 'Liên hệ', value: 'contact' }, { label: 'Báo giá', value: 'quote' }] },
    { name: 'fullName', label: 'Họ và tên', type: 'text', required: true },
    { name: 'phone', label: 'Số điện thoại', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'company', label: 'Công ty', type: 'text' },
    { name: 'city', label: 'Khu vực', type: 'text' },
    { name: 'product', label: 'Sản phẩm quan tâm', type: 'text' },
    { name: 'material', label: 'Vật liệu quan tâm', type: 'text' },
    { name: 'thickness', label: 'Độ dày', type: 'text' },
    { name: 'dimensions', label: 'Kích thước', type: 'text' },
    { name: 'quantity', label: 'Số lượng', type: 'text' },
    { name: 'cncRequirement', label: 'Yêu cầu CNC', type: 'textarea' },
    { name: 'message', label: 'Nội dung trao đổi', type: 'textarea' },
    { name: 'sourceURL', label: 'Trang gửi yêu cầu', type: 'text' },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
    { name: 'userAgent', type: 'text', admin: { hidden: true } },
    { name: 'attribution', label: 'Nguồn khách hàng', type: 'json', admin: { className: 'tp-advanced-field' } },
    { name: 'status', label: 'Trạng thái', type: 'select', required: true, defaultValue: 'new', options: [{ label: 'Mới', value: 'new' }, { label: 'Đã liên hệ', value: 'contacted' }, { label: 'Đã báo giá', value: 'quoted' }, { label: 'Đã chốt', value: 'won' }, { label: 'Không tiếp tục', value: 'lost' }, { label: 'Spam', value: 'spam' }, { label: 'Lưu trữ', value: 'archived' }] },
    { name: 'consentAt', label: 'Thời điểm đồng ý', type: 'date', required: true },
  ],
  timestamps: true,
}
