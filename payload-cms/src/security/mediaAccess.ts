import { matchesSecret } from './siteRebuild'

export function canAccessStagingMedia({
  secret,
  authorization,
  authenticated,
}: {
  secret?: string
  authorization?: string
  authenticated: boolean
}) {
  const supplied = authorization?.match(/^Bearer\s+(.+)$/iu)?.[1]
  return authenticated || matchesSecret(secret, supplied)
}
