import data from "@/content/categories/brands.json";
import { resolveMediaUrl } from "@/lib/media";

export type Product = {
  name: string;
  code: string;
  image: string;
  category: string;
  thickness: string;
  size: string;
  description: string;
  catalogueUrl: string;
};

export type Catalogue = {
  name: string;
  thumbnail: string;
  description: string;
  pdfUrl: string;
};

export type Brand = {
  slug: string;
  name: string;
  logo: string;
  description: string;
  catalogues: Catalogue[];
  products: Product[];
};

export const brands = (data.items as Brand[]).map((brand) => ({
  ...brand,
  logo: resolveMediaUrl(brand.logo),
  catalogues: brand.catalogues.map((catalogue) => ({
    ...catalogue,
    thumbnail: resolveMediaUrl(catalogue.thumbnail),
    pdfUrl: resolveMediaUrl(catalogue.pdfUrl),
  })),
  products: brand.products.map((product) => ({
    ...product,
    image: resolveMediaUrl(product.image),
    catalogueUrl: resolveMediaUrl(product.catalogueUrl),
  })),
}));

export function getBrand(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
