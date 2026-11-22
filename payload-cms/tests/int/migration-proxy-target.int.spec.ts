import { describe, expect, it } from 'vitest'
import { resolveMigrationProxyOptions } from '../../src/security/migrationProxy'

describe('Payload migration proxy target', () => {
  it('keeps local bindings by default', () => {
    expect(resolveMigrationProxyOptions(undefined, undefined)).toEqual({ environment: undefined, remoteBindings: false })
  })

  it('enables remote bindings only for an explicitly selected staging environment', () => {
    expect(resolveMigrationProxyOptions('staging', 'staging')).toEqual({ environment: 'staging', remoteBindings: true })
  })

  it('rejects remote production or mismatched environments', () => {
    expect(() => resolveMigrationProxyOptions('production', 'staging')).toThrow(/only.*allowed.*staging/i)
    expect(() => resolveMigrationProxyOptions('staging', 'production')).toThrow(/only.*allowed.*staging/i)
  })
})
