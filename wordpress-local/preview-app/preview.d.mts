export type PreviewPost = { id: number; slug: string; title: string; excerpt: string; content: string; publishedAt: string; updatedAt: string; author: string; category: string; featuredImage: string; featuredImageAlt: string };
export function getPreview(id: string, cookieHeader: string, fetcher?: typeof fetch): Promise<PreviewPost | null>;
