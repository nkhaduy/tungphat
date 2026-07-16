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
  slug: "an-cuong" | "thanh-thuy" | "ba-thanh" | "kes";
  name: string;
  logo: string;
  description: string;
  catalogues: Catalogue[];
  products: Product[];
};

export const brands: Brand[] = [
  {
    slug: "an-cuong",
    name: "An Cường",
    logo: "",
    description: "",
    catalogues: [],
    products: []
  },
  {
    slug: "thanh-thuy",
    name: "Thanh Thùy",
    logo: "",
    description: "",
    catalogues: [],
    products: []
  },
  {
    slug: "ba-thanh",
    name: "Ba Thanh",
    logo: "",
    description: "",
    catalogues: [],
    products: []
  },
  {
    slug: "kes",
    name: "KES",
    logo: "",
    description: "",
    catalogues: [],
    products: []
  }
];

export function getBrand(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
