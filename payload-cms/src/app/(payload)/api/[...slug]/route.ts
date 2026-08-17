/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { oversizedMediaRequest } from '@/security/mediaUpload'

export const GET = REST_GET(config)
const restPost = REST_POST(config)
export async function POST(request: Request, args: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await args.params
  if (slug.length === 1 && slug[0] === 'media' && oversizedMediaRequest(request.headers.get('content-length'))) {
    return Response.json({ errors: [{ message: 'Tệp tải lên không được vượt quá 15 MB.' }] }, { status: 413 })
  }
  return restPost(request, { params: Promise.resolve({ slug }) })
}
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
