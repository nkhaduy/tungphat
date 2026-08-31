import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getBranchPageConfig } from "@/lib/branch-pages";
import {
  createThanhThuyMetadata,
  getThanhThuyCategoryCopy,
} from "@/lib/thanh-thuy-seo";
import { getThanhThuyProduct } from "@/lib/thanh-thuy";

const implementationLanguage = /(?:giữ null trong JSON|layout shift|cấu hình doanh nghiệp dùng chung|source config|dữ liệu đã kiểm tra)/iu;
const waveTwoFiles = [
  "app/san-pham/page.tsx",
  "app/tham-chieu-vat-lieu/page.tsx",
  "components/materials/MaterialReferenceTable.tsx",
  "components/materials/MaterialSelector.tsx",
  "app/du-an/page.tsx",
  "app/lien-he/page.tsx",
  "app/chi-nhanh/[branch]/page.tsx",
  "app/thuong-hieu/ba-thanh/page.tsx",
  "components/thanh-thuy/ThanhThuyCategory.tsx",
  "components/thanh-thuy/ThanhThuyProductDetail.tsx",
  "lib/thanh-thuy-seo.ts",
];

describe("Wave 2 public copy", () => {
  it("does not expose implementation language in scoped public sources", () => {
    for (const file of waveTwoFiles) {
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(implementationLanguage);
    }
  });

  it("keeps hub and contact copy at the route boundary", () => {
    const productHub = fs.readFileSync("app/san-pham/page.tsx", "utf8");
    const contactPage = fs.readFileSync("app/lien-he/page.tsx", "utf8");
    expect(productHub).toContain("Tra cứu các nhóm vật liệu và bề mặt An Cường");
    expect(contactPage).toContain("Gọi hoặc nhắn Zalo để hỏi vật liệu");
  });

  it("gives every surface category its own buyer question and guidance", () => {
    const slugs = ["acrylic", "laminate", "pvc-film", "melamine", "veneer", "chi-nep-nhua"];
    const copies = slugs.map((slug) => getThanhThuyCategoryCopy({ slug, name: slug }));
    expect(new Set(copies.map((copy) => copy.description)).size).toBe(slugs.length);
    expect(new Set(copies.map((copy) => copy.guidance)).size).toBe(slugs.length);
    expect(fs.readFileSync("components/thanh-thuy/ThanhThuyCategory.tsx", "utf8")).not.toContain(
      "Tư vấn nền ván, màu cạnh và quy cách cắt theo hạng mục thực tế.",
    );
  });

  it("keeps separate customer context for both Tam Binh branch pages", () => {
    const first = getBranchPageConfig("14-tam-binh");
    const second = getBranchPageConfig("81b-tam-binh");
    expect(first?.visitGuidance).toBeTruthy();
    expect(second?.visitGuidance).toBeTruthy();
    expect(first?.visitGuidance).not.toBe(second?.visitGuidance);
  });

  it("keeps one Tùng Phát mention in the indexed LP detail title", () => {
    const product = getThanhThuyProduct("laminate", "thanh-thuy-lp-101-104g-white");
    if (!product) throw new Error("Missing LP 101/104G fixture");
    const metadata = createThanhThuyMetadata(product, "/san-pham/laminate/thanh-thuy-lp-101-104g-white/");
    const title = typeof metadata.title === "string" ? metadata.title : metadata.title?.absolute;
    expect(title?.match(/Tùng Phát/giu)).toHaveLength(1);
    expect(title).toContain("LP 101/104G");
  });
});
