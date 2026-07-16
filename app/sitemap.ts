import type { MetadataRoute } from 'next'

const baseUrl = 'https://www.mdftungphat.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...[
      '/catalogue/an-cuong',
      '/catalogue/thanh-thuy',
      '/catalogue/ba-thanh',
      '/san-pham',
      '/san-pham/an-cuong',
      '/san-pham/thanh-thuy',
      '/san-pham/ba-thanh',
      '/san-pham/kes',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...['/chinh-sach-bao-mat', '/dieu-khoan-su-dung'].map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]
}
