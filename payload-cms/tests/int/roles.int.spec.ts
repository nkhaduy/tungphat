import { afterEach, describe, expect, it, vi } from 'vitest'
import { canCreateUser } from '../../src/access/roles'

function createAccessArgs({ existingUsers = 0, headers = new Headers() }: { existingUsers?: number; headers?: Headers } = {}) {
  return {
    req: {
      headers,
      user: undefined,
      payload: { find: vi.fn().mockResolvedValue({ totalDocs: existingUsers }) },
    } as never,
  }
}

describe('initial CMS account access', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('requires the bootstrap secret before creating the first staging account', async () => {
    vi.stubEnv('CMS_ENVIRONMENT', 'staging')
    vi.stubEnv('BOOTSTRAP_SECRET', '')

    await expect(canCreateUser(createAccessArgs())).resolves.toBe(false)
  })

  it('accepts only a matching bootstrap secret for the first staging account', async () => {
    vi.stubEnv('CMS_ENVIRONMENT', 'staging')
    vi.stubEnv('BOOTSTRAP_SECRET', 'stage-bootstrap-test-secret')

    await expect(canCreateUser(createAccessArgs())).resolves.toBe(false)
    await expect(canCreateUser(createAccessArgs({ headers: new Headers({ 'x-bootstrap-secret': 'wrong' }) }))).resolves.toBe(false)
    await expect(canCreateUser(createAccessArgs({ headers: new Headers({ 'x-bootstrap-secret': 'stage-bootstrap-test-secret' }) }))).resolves.toBe(true)
  })

  it('keeps local first-account setup available without a secret', async () => {
    vi.stubEnv('CMS_ENVIRONMENT', 'local')
    vi.stubEnv('BOOTSTRAP_SECRET', '')

    await expect(canCreateUser(createAccessArgs())).resolves.toBe(true)
  })
})
