# Payload CMS hostname gateway

`cms.mdftungphat.com` is delegated to Tenten DNS and cannot be attached directly
to a Worker route in the current Cloudflare account. This Pages worker is the
hostname edge entry point; all CMS logic, data, auth, and media handling remain
in the Payload Worker.
