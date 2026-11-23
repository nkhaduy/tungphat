import { describe, expect, it } from 'vitest'
import { resolveMigrationProxyOptions } from '../../src/security/migrationProxy'

describe('Payload migration proxy target', () => {
  it('keeps local bindings by default', () => {
    expect(resolveMigrationProxyOptions(undefined, undefined)).toEqual({ environment: undefined, remoteBindings: false })
  })

  it('enables remote bindings only for an explicitly selected staging environment', () => {
    expect(resolveMigrationProxyOptions('staging', 'staging')).toEqual({ environment: 'staging', remoteBindings: true })
  })

  it('requires a separate opt-in before proxying production migrations', () => {
    expect(() => resolveMigrationProxyOptions('production', 'production')).toThrow(/explicit production migration opt-in/i)
    expect(resolveMigrationProxyOptions('production', 'production', true)).toEqual({ environment: 'production', remoteBindings: true })
  })

  it('rejects remote production or mismatched environments', () => {
    expect(() => resolveMigrationProxyOptions('production', 'staging')).toThrow(/target must match/i)
    expect(() => resolveMigrationProxyOptions('staging', 'production')).toThrow(/target must match/i)
  })
})
