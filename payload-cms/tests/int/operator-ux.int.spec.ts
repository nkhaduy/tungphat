import { Articles } from '@/collections/Articles'
import ModeSwitcher from '@/components/admin/ModeSwitcher'
import { Leads } from '@/collections/Leads'
import { MaterialCodes } from '@/collections/MaterialCodes'
import { Media } from '@/collections/Media'
import { Products } from '@/collections/Products'
import { runtimeEndpoints } from '@/endpoints/runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

describe('operator-first CMS IA', () => {
	it('uses business labels and groups without changing collection identifiers', () => {
		expect(MaterialCodes.labels?.plural).toBe('Mã màu / catalogue')
		expect(MaterialCodes.admin?.group).toBe('Sản phẩm & mã hàng')
		expect(Products.labels?.plural).toBe('Sản phẩm / vật liệu')
		expect(Products.admin?.group).toBe('Sản phẩm & mã hàng')
		expect(Leads.labels?.plural).toBe('Khách hỏi hàng')
		expect(Media.labels?.plural).toBe('Hình ảnh & tài liệu')
		expect(Articles.admin?.group).toBe('Nội dung website')
	})

	it('searches exact material codes, supplier names and Vietnamese accents', async () => {
		const endpoint = runtimeEndpoints.find((item) => item.path === '/search' && item.method === 'get')
		expect(endpoint).toBeDefined()

		const find = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => collection === 'material-codes'
			? { docs: [
				{ id: 'code-301', code: '301', name: 'Artistic Stripe', supplier: { name: 'Thanh Thuỳ' }, category: { name: 'Melamine' }, status: 'published', updatedAt: '2026-09-01T00:00:00.000Z', stableKey: 'hidden-key' },
				{ id: 'code-1301', code: '1301', name: 'Mẫu khác', supplier: { name: 'Thanh Thuỳ' }, category: { name: 'Melamine' }, status: 'published', updatedAt: '2026-09-01T00:00:00.000Z' },
			] }
			: { docs: [] })

		const response = await endpoint?.handler({
			url: 'https://cms.mdftungphat.com/api/search?q=301',
			user: { id: 1, role: 'admin' },
			payload: { find },
		} as never)
		const body = await response?.json() as { results: Array<Record<string, string>> }

		expect(response?.status).toBe(200)
		expect(body.results[0]).toMatchObject({
			type: 'Mã màu / catalogue',
			title: '301 — Artistic Stripe',
			supplier: 'Thanh Thuỳ',
			detail: 'Melamine',
			href: '/admin/collections/material-codes/code-301',
		})
		expect(JSON.stringify(body.results)).not.toContain('hidden-key')

		const accentResponse = await endpoint?.handler({
			url: 'https://cms.mdftungphat.com/api/search?q=Thanh%20Thuy',
			user: { id: 1, role: 'admin' },
			payload: { find },
		} as never)
		const accentBody = await accentResponse?.json() as { results: Array<Record<string, string>> }
		expect(accentBody.results[0].supplier).toBe('Thanh Thuỳ')
	})

	it('does not miss exact codes outside the newest catalog page', async () => {
		const endpoint = runtimeEndpoints.find((item) => item.path === '/search' && item.method === 'get')
		expect(endpoint).toBeDefined()
		const find = vi.fn().mockImplementation(async ({ collection, where, limit }: { collection: string; where?: unknown; limit?: number }) => {
			if (collection === 'suppliers') return { docs: [{ id: 3, name: 'Thanh Thuỳ' }] }
			const whereText = JSON.stringify(where ?? '')
			if (collection === 'material-codes' && whereText.includes('code') && whereText.includes('like')) {
				return { docs: [{ id: 3485, code: '301', name: '301 Artistic Stripe', supplier: { id: 3, name: 'Thanh Thuỳ' }, category: { name: 'Melamine' }, status: 'published' }] }
			}
			return { docs: [], totalDocs: limit ? 3639 : 0 }
		})

		const response = await endpoint?.handler({
			url: 'https://cms.mdftungphat.com/api/search?q=301',
			user: { id: 1, role: 'admin' },
			payload: { find },
		} as never)
		const body = await response?.json() as { results: Array<Record<string, string>> }

		expect(body.results[0]?.title).toBe('301 — 301 Artistic Stripe')
		const materialQuery = find.mock.calls.find(([options]) => options.collection === 'material-codes')?.[0]
		expect(materialQuery?.limit).toBeLessThan(500)
			 expect(materialQuery?.where).toEqual(expect.objectContaining({ or: expect.any(Array) }))
		})

		it('finds accented customer names when the operator types without Vietnamese marks', async () => {
			const endpoint = runtimeEndpoints.find((item) => item.path === '/search' && item.method === 'get')
			expect(endpoint).toBeDefined()
			const find = vi.fn().mockImplementation(async ({ collection, where }: { collection: string; where?: unknown }) => {
				if (collection === 'suppliers') return { docs: [] }
				if (collection === 'leads' && where) return { docs: [] }
				if (collection === 'leads') return { docs: [{ id: 77, fullName: 'Nguyễn Văn A', phone: '0908123456', type: 'quote', material: 'MDF', status: 'new', createdAt: '2026-09-01T00:00:00.000Z' }] }
				return { docs: [] }
			})

			const response = await endpoint?.handler({
				url: 'https://cms.mdftungphat.com/api/search?q=Nguyen%20Van%20A',
				user: { id: 1, role: 'admin' },
				payload: { find },
			} as never)
			const body = await response?.json() as { results: Array<Record<string, string>> }

			expect(body.results[0]).toMatchObject({
				type: 'Khách hỏi hàng',
				title: 'Nguyễn Văn A',
				detail: '0908123456 · Báo giá · MDF',
				href: '/admin/collections/leads/77',
			})
		})

		it('keeps Advanced mode restricted to administrator roles', () => {
		const permissions = { collections: { users: { read: true } } }
		const editorMarkup = renderToStaticMarkup(ModeSwitcher({ user: { id: 1, role: 'editor' }, permissions } as never))
		const unknownMarkup = renderToStaticMarkup(ModeSwitcher({ user: { id: 2, role: 'custom-role' }, permissions } as never))

		expect(editorMarkup).not.toContain('Nâng cao')
		expect(unknownMarkup).not.toContain('Nâng cao')
	})
})
