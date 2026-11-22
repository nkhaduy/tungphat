import imageIndex from "@/data/product-image-index.json";

type ImageCredit = { sourceUrl: string; author: string; licenseUrl: string; license: string };
const imageCredits: Record<string, { credit: ImageCredit | null }> = imageIndex;

export function MaterialPhotoCredit({ slug }: { slug: string }) {
  const credit = imageCredits[slug]?.credit;
  if (!credit) return null;
  return <p className="mt-3 text-xs leading-6 text-slate-600">Ảnh: <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{credit.author}</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{credit.license}</a>. Ảnh đã được tối ưu kích thước và định dạng.</p>;
}
