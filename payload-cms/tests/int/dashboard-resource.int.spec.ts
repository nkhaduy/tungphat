import Dashboard from '@/components/admin/Dashboard'
import type { DashboardViewServerProps } from '@payloadcms/next/views'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

describe('Payload admin dashboard resource budget', () => {
	it('fetches scoped task counters and only useful fields for recent items', async () => {
		const count = vi.fn().mockResolvedValue({ totalDocs: 3 })
		const find = vi.fn().mockImplementation(async ({ collection, limit }: { collection: string; limit: number }) => ({
			docs: limit ? [{ id: collection === 'material-codes' ? '1' : `${collection}-1`, title: `Tên ${collection}`, name: `Tên ${collection}`, code: '301', updatedAt: '2026-09-01T00:00:00.000Z', _status: 'published', status: 'published' }] : [],
			totalDocs: 3,
		}))
		const req = { user: { id: 1, role: 'super-admin' } }

		const view = await Dashboard({
			payload: { count, find },
			initPageResult: { req },
			user: req.user,
		} as unknown as DashboardViewServerProps)
		const html = renderToStaticMarkup(view)

		expect(html).toContain('Khách hỏi mới')
		expect(html).toContain('Bài viết bản nháp')
		expect(html).toContain('Sản phẩm đang hiển thị')
		expect(html).toContain('Mã màu đang hiển thị')
		expect(html).not.toContain('Nội dung public')
		expect(html).not.toContain('Trạng thái hệ thống')
		expect(html).not.toContain('D1')
		expect(html).not.toContain('R2')
		expect(html).toContain('/admin/collections/material-codes/1')
		expect(html).toContain('Sửa gần đây')

		const countCalls = count.mock.calls.map(([options]) => options)
		expect(countCalls).toEqual(expect.arrayContaining([
			expect.objectContaining({ collection: 'leads', where: { status: { equals: 'new' } } }),
			expect.objectContaining({ collection: 'articles', where: { _status: { equals: 'draft' } } }),
			expect.objectContaining({ collection: 'products', where: { _status: { equals: 'published' } } }),
			expect.objectContaining({ collection: 'material-codes', where: { status: { equals: 'published' } } }),
		]))
		expect(find.mock.calls.every(([options]) => options.depth === 0 && options.overrideAccess === false)).toBe(true)
	})

	it('uses operator language for editors without implying publish permission', async () => {
		const count = vi.fn().mockResolvedValue({ totalDocs: 0 })
		const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 })
		const req = { user: { id: 1, role: 'editor' } }

		const view = await Dashboard({
			payload: { count, find },
			initPageResult: { req },
			user: req.user,
		} as unknown as DashboardViewServerProps)
		const html = renderToStaticMarkup(view)

		expect(html).toContain('Soạn bài viết')
		expect(html).not.toContain('Đăng bài')
	})
})
