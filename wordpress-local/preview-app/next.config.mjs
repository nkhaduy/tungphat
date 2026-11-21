/** Local-only server; it does not use the production static export configuration. */
export default {
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: { externalDir: true },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ] }];
  },
};
