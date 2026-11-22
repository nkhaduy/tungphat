import { DurableObject } from 'cloudflare:workers'

// Per-workspace Payload runtime; public assets and preflight bypass it at the gateway.
// The site workspace is the coordination boundary; all business data stays in D1/R2.
export class PayloadWorkspace extends DurableObject {
  async fetch(request) {
    const { default: app } = await import('./.open-next/worker.js')
    return app.fetch(request, this.env, { waitUntil: promise => this.ctx.waitUntil(promise) })
  }
}

const cmsGateway = {
  fetch(request, env) {
    return env.PAYLOAD_WORKSPACE.getByName(`tungphat-${env.CMS_ENVIRONMENT}`).fetch(request)
  },
}

export default cmsGateway
