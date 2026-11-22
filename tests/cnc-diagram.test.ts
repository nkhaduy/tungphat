import { expect, it } from 'vitest';
import { splitCncArticle } from '@/lib/cnc-article-diagram';

it('places the drawing before the discussion of common file errors and preserves other articles', () => {
  const body = '## Checklist\nNội dung.\n\n## Ba chỗ hay nhầm trong file\nGiải thích.';
  expect(splitCncArticle('chuan-bi-file-cnc', body)).toEqual(['## Checklist\nNội dung.\n\n', '## Ba chỗ hay nhầm trong file\nGiải thích.']);
  expect(splitCncArticle('another', body)).toBeNull();
  expect(splitCncArticle('chuan-bi-file-cnc', 'Bài đã đổi cấu trúc')).toEqual(['Bài đã đổi cấu trúc', '']);
});

it('preserves the diagram when its editorial heading changes or is duplicated', () => {
  expect(splitCncArticle('chuan-bi-file-cnc', 'Bài đã đổi cấu trúc')).toEqual(['Bài đã đổi cấu trúc', '']);
  const duplicate = '## Ba chỗ hay nhầm trong file\nNội dung.\n## Ba chỗ hay nhầm trong file\nKhác.';
  expect(splitCncArticle('chuan-bi-file-cnc', duplicate)).toEqual([duplicate, '']);
});
