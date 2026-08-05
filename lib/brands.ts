import data from "@/content/categories/brands.json";

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

export const brands = data.items as Brand[];

export function cataloguePath(slug: string): string {
  return slug === "thanh-thuy"
    ? "/thuong-hieu/thanh-thuy/"
    : `/catalogue/${slug}/`;
}

export function catalogueStaticParams(): Array<{ brand: string }> {
  return brands
    .filter((brand) => brand.slug !== "kes" && brand.slug !== "thanh-thuy")
    .map((brand) => ({ brand: brand.slug }));
}

export function getBrand(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
