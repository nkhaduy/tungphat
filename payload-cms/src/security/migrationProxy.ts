export function resolveMigrationProxyOptions(environment: string | undefined, target: string | undefined, allowProduction = false) {
  if (target === undefined) return { environment, remoteBindings: false }
  if (target !== environment) throw new Error('The remote migration target must match the explicitly selected Cloudflare environment.')
  if (target === 'staging') return { environment: 'staging', remoteBindings: true }
  if (target === 'production' && allowProduction) return { environment: 'production', remoteBindings: true }
  if (target === 'production') throw new Error('Production migrations require an explicit production migration opt-in.')
  throw new Error('Remote Payload migrations are only allowed for the explicitly selected staging environment.')
}
