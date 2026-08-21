import type { GlobalConfig } from 'payload'
import { canManageContent, isAuthenticated, isSuperAdmin, roleOf } from '@/access/roles'

export const contentGlobalAccess: GlobalConfig['access'] = {
  read: () => true,
  update: canManageContent,
}

export const sensitiveGlobalAccess: GlobalConfig['access'] = {
  read: isAuthenticated,
  update: ({ req }) => roleOf(req) === 'super-admin' || roleOf(req) === 'admin',
}

export const systemGlobalAccess: GlobalConfig['access'] = {
  read: isAuthenticated,
  update: isSuperAdmin,
}

