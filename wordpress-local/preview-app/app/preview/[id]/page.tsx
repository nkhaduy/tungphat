import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArticleLanding } from '@/components/content/ArticleLanding';
import type { ContentEntry } from '@/lib/content';
import type { ArticleFrontmatter } from '@/lib/content-schema';
import { getPreview } from '../../../preview.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default async function PreviewPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const post = await getPreview(id, requestHeaders.get('cookie') || '');
  if (!post) notFound();
  let image = '';
  try {
    const url = new URL(post.featuredImage);
    if (url.origin === 'http://127.0.0.1:9400' && !url.username && !url.password) image = url.href;
  } catch { /* No featured image. */ }
  const article: ContentEntry<ArticleFrontmatter> = {
    title: post.title || '(Chưa có tiêu đề)', slug: post.slug || `draft-${id}`, excerpt: post.excerpt || '',
    publishedAt: post.publishedAt || '', updatedAt: post.updatedAt || '', author: post.author || 'Ban biên tập', category: post.category || 'Bài viết', tags: [],
    featuredImage: image, featuredImageAlt: post.featuredImageAlt || post.title, gallery: [], video: '', catalogue: '', ogImage: '', draft: true, featured: false,
    seoTitle: '', seoDescription: '', canonical: '', noindex: true, relatedProducts: [], relatedArticles: [], faq: [],
    body: post.content, sourcePath: `wordpress://${id}`, wordpress: { html: post.content, mediaOrigin: 'http://127.0.0.1:9400', allowInsecureLoopback: true },
  };
  return <><div role="status" style={{background:'#ffe6a5',padding:'12px',textAlign:'center'}}>Bản xem trước nội dung đã lưu — chỉ người có quyền chỉnh sửa mới xem được.</div><ArticleLanding article={article} /></>;
}
