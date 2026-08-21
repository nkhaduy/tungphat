import Dashboard from '@/components/admin/Dashboard'
import type { DashboardViewServerProps } from '@payloadcms/next/views'
import { describe, expect, it, vi } from 'vitest'

describe('Payload admin dashboard resource budget', () => {
  it('fetches only recent-card fields and avoids loading documents for count-only cards', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [],
      totalDocs: 0,
      limit: 5,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    })
    const req = { user: { id: 1, role: 'super-admin' } }

    await Dashboard({
      payload: { find },
      initPageResult: { req },
      user: req.user,
    } as unknown as DashboardViewServerProps)

    const calls = find.mock.calls.map(([options]) => options)
    expect(calls).toHaveLength(6)
    expect(calls.filter((options) => options.limit === 0).map((options) => options.collection)).toEqual(['media', 'articles'])
    expect(calls.filter((options) => options.limit === 5).map((options) => options.select)).toEqual([
      { title: true, updatedAt: true },
      { title: true, updatedAt: true },
      { title: true, updatedAt: true },
      { title: true, updatedAt: true },
    ])
    expect(calls.every((options) => options.depth === 0 && options.overrideAccess === false)).toBe(true)
  })
})
