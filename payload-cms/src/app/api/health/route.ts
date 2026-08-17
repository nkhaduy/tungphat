import { getCloudflareContext } from '@opennextjs/cloudflare'
import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  try {
    const { env } = await getCloudflareContext({ async: true })
    const bindings = env as CloudflareEnv & { BUILD_VERSION?: string; CMS_ENVIRONMENT?: string }
    await getPayload({ config })
    const migration = await bindings.D1.prepare('SELECT name FROM payload_migrations ORDER BY id DESC LIMIT 1').first<{ name: string }>()
    return Response.json({
      ok: true,
      environment: bindings.CMS_ENVIRONMENT === 'production' ? 'production' : bindings.CMS_ENVIRONMENT === 'staging' ? 'staging' : 'unknown',
      database: 'ok',
      migration: migration?.name ? 'current' : 'missing',
      media: bindings.R2 ? 'configured' : 'missing',
      build: bindings.BUILD_VERSION ?? 'unknown',
      latencyMs: Date.now() - startedAt,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error(JSON.stringify({ message: 'health check failed', error: error instanceof Error ? error.message : 'unknown' }))
    return Response.json({ ok: false, environment: process.env.CMS_ENVIRONMENT ?? 'unknown', database: 'unavailable', migration: 'unknown', media: 'unknown' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
