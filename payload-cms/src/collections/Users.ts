import type { CollectionConfig } from 'payload'
import { canCreateUser, firstUserIsSuperAdmin, isSuperAdmin, roleOf } from '@/access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Tài khoản', plural: 'Tài khoản' },
  admin: {
    group: 'Tài khoản',
    useAsTitle: 'name',
    description: 'Tài khoản quản trị Payload. Chỉ Super Admin được quản lý người dùng và phân quyền.',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    listSearchableFields: ['name', 'email'],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useSessions: true,
    cookies: {
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    create: canCreateUser,
    read: ({ req }) => roleOf(req) === 'super-admin' || (req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => roleOf(req) === 'super-admin' || (req.user ? { id: { equals: req.user.id } } : false),
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [
      firstUserIsSuperAdmin(),
      ({ data, originalDoc, operation, req }) => {
        const requesterRole = roleOf(req)
        if (operation === 'update' && requesterRole !== 'super-admin' && originalDoc && data.role && data.role !== originalDoc.role) {
          throw new Error('Chỉ Super Admin được thay đổi phân quyền.')
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Họ và tên', type: 'text', required: true, minLength: 2, maxLength: 100 },
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      access: { update: ({ req }) => roleOf(req) === 'super-admin' },
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Biên tập viên', value: 'editor' },
      ],
    },
  ],
  timestamps: true,
}
