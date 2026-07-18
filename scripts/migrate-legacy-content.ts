import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

// Snapshot of the exact values that lived in lib/brands.ts and lib/locations.ts
// before the CMS migration. Keeping the source here makes the one-time migration
// reproducible instead of copying values by hand.
const legacyBrands = [
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

const legacyLocations = [
  {
    id: "chi-nhanh-1",
    shortId: "CN1",
    name: "Tùng Phát – Chi nhánh 1",
    address: "14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    streetAddress: "14 Tam Bình, phường Hiệp Bình",
    addressLocality: "TP. Hồ Chí Minh",
    addressRegion: "Hồ Chí Minh",
    addressCountry: "VN",
    embedSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.5370572533293!2d106.7289773!3d10.8466962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527a60336dce9%3A0xe397be298b9a97af!2zQ-G7rWEgSMOgbmcgR-G7lyBHaMOpcCBUw7luZyBQaMOhdA!5e0!3m2!1svi!2s!4v1783761448496!5m2!1svi!2s",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=14%20Tam%20B%C3%ACnh%2C%20ph%C6%B0%E1%BB%9Dng%20Hi%E1%BB%87p%20B%C3%ACnh%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh"
  },
  {
    id: "chi-nhanh-2",
    shortId: "CN2",
    name: "Tùng Phát – Chi nhánh 2",
    address: "81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    streetAddress: "81B Tam Bình, phường Hiệp Bình",
    addressLocality: "TP. Hồ Chí Minh",
    addressRegion: "Hồ Chí Minh",
    addressCountry: "VN",
    embedSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4493770330487!2d106.7307288!3d10.8533852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527295201638d%3A0x96d9f4e833b55234!2zTURGIC0gQ05DIFTDmU5HIFBIw4FU!5e0!3m2!1svi!2s!4v1783761503530!5m2!1svi!2s",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=81B%20Tam%20B%C3%ACnh%2C%20ph%C6%B0%E1%BB%9Dng%20Hi%E1%BB%87p%20B%C3%ACnh%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh"
  }
];

const write = process.argv.includes("--write");
const root = process.cwd();
const brandTarget = path.join(root, "content", "categories", "brands.json");
const businessTarget = path.join(root, "content", "settings", "business.json");
const business = JSON.parse(fs.readFileSync(businessTarget, "utf8")) as Record<string, unknown>;

const outputs = [
  [brandTarget, `${JSON.stringify({ items: legacyBrands }, null, 2)}\n`],
  [businessTarget, `${JSON.stringify({ ...business, locations: legacyLocations }, null, 2)}\n`]
] as const;

for (const [file, value] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const relative = path.relative(root, file);
  const semanticallyEqual = current.length > 0 && isDeepStrictEqual(JSON.parse(current), JSON.parse(value));
  if (semanticallyEqual) console.log(`${relative}: đã đồng bộ, không thay đổi.`);
  else if (write) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
    console.log(`${relative}: đã ghi snapshot legacy vào content model.`);
  } else {
    console.log(`${relative}: khác snapshot; dry-run không ghi. Thêm --write chỉ khi đang migrate từ v2.`);
  }
}

console.log("Không tạo sản phẩm/bài viết giả từ dữ liệu thiếu; entry chưa đủ schema phải được hoàn thiện trong CMS.");
