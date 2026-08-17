import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  name: 'Quản trị viên local',
  email: 'dev@payloadcms.com',
  password: 'test',
  role: 'super-admin' as const,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<string | number> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  const created = await payload.create({
    collection: 'users',
    draft: false,
    overrideAccess: true,
    data: testUser,
  })
  return created.id
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
