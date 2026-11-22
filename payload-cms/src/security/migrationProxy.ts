export function resolveMigrationProxyOptions(environment: string | undefined, target: string | undefined) {
  if (target === undefined) return { environment, remoteBindings: false }
  if (target !== 'staging' || environment !== 'staging') {
    throw new Error('Remote Payload migrations are only allowed for the explicitly selected staging environment.')
  }
  return { environment: 'staging', remoteBindings: true }
}
