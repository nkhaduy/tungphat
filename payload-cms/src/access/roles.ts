import crypto from 'node:crypto'
import { APIError, type Access, type CollectionBeforeChangeHook, type PayloadRequest } from 'payload'

export type CmsRole = 'super-admin' | 'admin' | 'editor'

export function roleOf(req: PayloadRequest): CmsRole | undefined {
  const role = req.user && 'role' in req.user ? req.user.role : undefined
  return role === 'super-admin' || role === 'admin' || role === 'editor' ? role : undefined
}

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const isSuperAdmin: Access = ({ req }) => roleOf(req) === 'super-admin'

export const canManageContent: Access = ({ req }) => {
  const role = roleOf(req)
  return role === 'super-admin' || role === 'admin' || role === 'editor'
}

export const canPublishContent: Access = ({ req }) => {
  const role = roleOf(req)
  return role === 'super-admin' || role === 'admin'
}

export const canDeleteContent: Access = ({ req }) => {
  const role = roleOf(req)
  return role === 'super-admin' || role === 'admin'
}

export const canCreateUser: Access = async ({ req }) => {
  if (roleOf(req) === 'super-admin') return true
  if (req.user) return false
  const existing = await req.payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })
  if (existing.totalDocs !== 0) return false
  if (process.env.CMS_ENVIRONMENT !== 'production') return true
  const expected = process.env.BOOTSTRAP_SECRET ?? ''
  const supplied = req.headers.get('x-bootstrap-secret') ?? ''
  if (!expected || !supplied) return false
  const expectedBytes = Buffer.from(expected)
  const suppliedBytes = Buffer.from(supplied)
  return expectedBytes.length === suppliedBytes.length && crypto.timingSafeEqual(expectedBytes, suppliedBytes)
}

export const publicPublished: Access = ({ req }) => {
  // Public requests may only see published records. Admin requests retain drafts.
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

export function preventEditorPublish(): CollectionBeforeChangeHook {
  return ({ data, req }) => {
    if (roleOf(req) === 'editor' && data._status === 'published') {
      throw new APIError('Biên tập viên chỉ có thể lưu bản nháp. Admin hoặc Super Admin sẽ xuất bản nội dung.', 403)
    }
    return data
  }
}

export function firstUserIsSuperAdmin(): CollectionBeforeChangeHook {
  return async ({ data, req, operation }) => {
    if (operation !== 'create') return data
    const existing = await req.payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })
    if (existing.totalDocs === 0) return { ...data, role: 'super-admin' }
    return data.role ? data : { ...data, role: 'editor' }
  }
}
