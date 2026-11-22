import manifest from '../payload-cms/gateway/media-archive-manifest.json';
const objects = new Map(manifest.objects.map(object => [object.key, object]));
// Local Miniflare + remote R2 binding only. Never deploy this maintenance worker.
const maintenance = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return new Response(null, { status: 403 });
    if (request.method === 'GET' && url.pathname === '/inventory') {
      const listing = await env.R2.list({ limit: 1000, cursor: url.searchParams.get('cursor') || undefined });
      return Response.json({ cursor: listing.cursor, truncated: listing.truncated, objects: listing.objects.map(({ key, size, etag }) => ({ key, size, etag })) });
    }
    const object = objects.get(url.searchParams.get('key'));
    if (!object) return new Response(null, { status: 404 });
    if (request.method === 'GET') return Response.json(await env.R2.head(object.key));
    if (request.method === 'DELETE') {
      if (env.ALLOW_ARCHIVE_OFFLOAD !== 'verified-exact-backup-and-cdn') return new Response(null, { status: 403 });
      const current = await env.R2.head(object.key);
      if (!current) return new Response(null, { status: 204 });
      if (current.etag !== object.etag || current.size !== object.bytes) return new Response('Object changed', { status: 412 });
      await env.R2.delete(object.key);
      return new Response(null, { status: 204 });
    }
    if (request.method === 'PUT') {
      // Restore only when the immutable key is absent; never overwrite a newer object.
      const metadata = JSON.parse(request.headers.get('X-R2-Metadata') || '{}');
      const restored = await env.R2.put(object.key, request.body, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: metadata.httpMetadata || metadata, customMetadata: metadata.customMetadata || {} });
      return new Response(null, { status: restored ? 201 : 412 });
    }
    return new Response(null, { status: 405 });
  },
};
export default maintenance;
