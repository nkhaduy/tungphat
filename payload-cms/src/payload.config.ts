import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CloudflareContext } from '@opennextjs/cloudflare'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { r2Storage } from '@payloadcms/storage-r2'
import { vi } from '@payloadcms/translations/languages/vi'
import { buildConfig } from 'payload'
import type { GetPlatformProxyOptions } from 'wrangler'

import { Articles } from '@/collections/Articles'
import { AnalyticsEvents } from '@/collections/AnalyticsEvents'
import { Categories } from '@/collections/Categories'
import { GbpConnections } from '@/collections/GbpConnections'
import { Leads } from '@/collections/Leads'
import { MaterialCodes } from '@/collections/MaterialCodes'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Products } from '@/collections/Products'
import { Projects } from '@/collections/Projects'
import { Redirects } from '@/collections/Redirects'
import { Reviews } from '@/collections/Reviews'
import { Suppliers } from '@/collections/Suppliers'
import { Users } from '@/collections/Users'
import { Brands } from '@/globals/Brands'
import { BusinessSettings } from '@/globals/BusinessSettings'
import { MaterialCategories } from '@/globals/MaterialCategories'
import { SeoDefaults } from '@/globals/SeoDefaults'
import { StaticPages } from '@/globals/StaticPages'
import { migrations } from '@/migrations'
import { stagingEmailAdapter } from '@/email/stagingEmailAdapter'
import { createPreviewToken } from '@/security/previewToken'
import { installWebCryptoPbkdf2 } from '@/security/webCryptoPbkdf2'
import { runtimeEndpoints } from '@/endpoints/runtime'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

installWebCryptoPbkdf2()
const isCLI = process.argv.some((value) => {
  if (!value || !fs.existsSync(value)) return false
  return fs.realpathSync(value).endsWith(path.join('payload', 'bin.js'))
})
const isProduction = process.env.NODE_ENV === 'production'
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'
const cloudflare = isCLI || !isProduction || isNextBuild
  ? await getCloudflareContextFromWrangler(isNextBuild ? { persist: false } : undefined)
  : await getCloudflareContext({ async: true })
const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:3000'
const siteURL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mdftungphat.com'

export default buildConfig({
  admin: {
    user: Users.slug,
    avatar: 'default',
    theme: 'light',
    dateFormat: 'dd/MM/yyyy HH:mm',
    timezones: { defaultTimezone: 'Asia/Ho_Chi_Minh', supportedTimezones: [{ label: 'Việt Nam', value: 'Asia/Ho_Chi_Minh' }] },
    importMap: { baseDir: dirname },
    meta: {
      titleSuffix: ' · Tùng Phát CMS',
      description: 'Quản trị nội dung Tùng Phát',
      icons: [
        { rel: 'icon', url: 'https://mdftungphat.com/favicon.ico' },
        { rel: 'apple-touch-icon', url: 'https://mdftungphat.com/apple-icon.png' },
      ],
    },
    components: {
      graphics: { Logo: '/components/admin/Brand#Logo', Icon: '/components/admin/Brand#Icon' },
      actions: ['/components/admin/OpenWebsite'],
      beforeNavLinks: ['/components/admin/ModeSwitcher', '/components/admin/OperatorNavHome'],
      providers: ['/components/admin/AccessibilityProvider'],
      views: {
        dashboard: { Component: '/components/admin/Dashboard' },
        login: { Component: '/components/admin/LoginView' },
      },
    },
    livePreview: {
      collections: ['products', 'articles', 'projects', 'pages'],
      url: ({ data, collectionConfig }) => {
        const slug = typeof data.slug === 'string' ? data.slug : ''
        if (!slug) return null
        const collection = String(collectionConfig?.slug)
        if (!['products', 'articles', 'projects', 'pages'].includes(collection)) return null
        const token = createPreviewToken(collection, slug)
        return `${serverURL}/preview/${collection}/${slug}${token ? `?previewToken=${encodeURIComponent(token)}` : ''}`
      },
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [Leads, Reviews, Products, MaterialCodes, Suppliers, Categories, Media, Articles, Projects, Pages, AnalyticsEvents, Redirects, GbpConnections, Users],
  globals: [StaticPages, BusinessSettings, MaterialCategories, Brands, SeoDefaults],
  endpoints: runtimeEndpoints,
  defaultDepth: 0,
  i18n: { supportedLanguages: { vi }, fallbackLanguage: 'vi' },
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL,
  cors: [serverURL, siteURL],
  csrf: [serverURL, siteURL],
  email: stagingEmailAdapter,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
    push: false,
  }),
  plugins: [r2Storage({ bucket: cloudflare.env.R2, collections: { media: { prefix: 'uploads' } } })],
})

function getCloudflareContextFromWrangler(options?: GetPlatformProxyOptions): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(({ getPlatformProxy }) =>
    getPlatformProxy({ environment: process.env.CLOUDFLARE_ENV, remoteBindings: false, ...options } satisfies GetPlatformProxyOptions),
  )
}
