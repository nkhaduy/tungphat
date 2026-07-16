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
    description: "Các dòng vật liệu và bề mặt mang thương hiệu An Cường đang được Tùng Phát giới thiệu theo nhu cầu từng hạng mục.",
    catalogues: [],
    products: []
  },
  {
    slug: "thanh-thuy",
    name: "Thanh Thùy",
    logo: "",
    description: "Thông tin vật liệu mang thương hiệu Thanh Thùy, phù hợp để tham khảo trước khi kiểm tra quy cách và catalogue.",
    catalogues: [],
    products: []
  },
  {
    slug: "ba-thanh",
    name: "Ba Thanh",
    logo: "",
    description: "Trang tổng hợp thông tin vật liệu mang thương hiệu Ba Thanh tại Tùng Phát; dữ liệu chi tiết đang được bổ sung.",
    catalogues: [],
    products: []
  },
  {
    slug: "kes",
    name: "KES",
    logo: "",
    description: "Thông tin các dòng vật liệu mang thương hiệu KES đang được Tùng Phát giới thiệu theo nhu cầu vật liệu và bề mặt.",
    catalogues: [],
    products: []
  }
];

export function getBrand(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
