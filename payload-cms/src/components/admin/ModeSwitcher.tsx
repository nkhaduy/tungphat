import type { ServerProps } from 'payload'
import React from 'react'
import ModeSwitcherClient from './ModeSwitcherClient'

type Props = Pick<ServerProps, 'user'>

export default function ModeSwitcher({ user }: Props) {
  const role = user && typeof user === 'object' && 'role' in user ? user.role : undefined
  const canUseAdvanced = role === 'admin' || role === 'super-admin'

  return <ModeSwitcherClient canUseAdvanced={canUseAdvanced} />
}
