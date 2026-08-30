# Payload CMS hostname gateway

`cms.mdftungphat.com` and `cdn.mdftungphat.com` are delegated to Tenten DNS and
cannot be attached directly to a Worker route in the current Cloudflare account.
This Pages worker is their hostname edge entry point. CMS requests pass through
unchanged; canonical CDN paths map to Payload's R2 media route. All CMS logic,
data, auth, and media storage remain in the Payload Worker and R2 bucket.
