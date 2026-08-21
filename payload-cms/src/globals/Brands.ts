import type { GlobalConfig } from 'payload'
import { contentGlobalAccess } from './access'
import { imageRelationship, slugField, vietnameseText } from '@/fields/common'

export const Brands: GlobalConfig = {
  slug: 'brands', label: 'Thương hiệu', access: contentGlobalAccess,
  admin: { group: 'Sản phẩm và dịch vụ', description: 'Thương hiệu và catalogue được website giới thiệu.' },
  fields: [{
    name: 'items', label: 'Danh sách thương hiệu', type: 'array', required: true, minRows: 1,
    fields: [
      slugField(false), vietnameseText('name', 'Tên', { required: true, minLength: 2, maxLength: 100 }),
      imageRelationship('logo', 'Logo'), { name: 'description', label: 'Mô tả', type: 'textarea', required: true, minLength: 20, maxLength: 300 },
      { name: 'catalogues', label: 'Catalogue', type: 'array', fields: [
        vietnameseText('name', 'Tên', { required: true }), imageRelationship('thumbnail', 'Thumbnail'),
        { name: 'description', label: 'Mô tả', type: 'textarea', maxLength: 300 },
        { name: 'pdf', label: 'PDF', type: 'relationship', relationTo: 'media' },
      ] },
      { name: 'legacyProducts', label: 'Sản phẩm legacy', type: 'json', access: { read: ({ req }) => Boolean(req.user) }, admin: { readOnly: true, description: 'Giữ để đối chiếu migration; website hiện không có contract ổn định cho field này.' } },
    ],
  }],
}
