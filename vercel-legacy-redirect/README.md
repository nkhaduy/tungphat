# Legacy-domain redirect service

This standalone Vercel static project redirects the old website hostnames to `https://gotungphat.com`.

- Explicit legacy URL mappings run before the catch-all so migrated product, catalogue, CNC, and article paths go directly to their final URL.
- The final `/(.*)` rule returns HTTP 301 and preserves the captured path and incoming query string.
- The project is separate from the Next.js website and has no CMS, quote-app, or database bindings.
- Deploy the directory with the Vercel project `tungphat-legacy-redirect`; keep the existing old-domain DNS records unchanged.
