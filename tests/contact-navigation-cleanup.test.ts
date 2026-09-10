import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("contact and navigation cleanup", () => {
  it("keeps desktop navigation to useful child destinations and manages one open menu", () => {
    const header = read("components/site/SiteHeader.tsx");

    expect(header).not.toContain("Tổng quan ${item.label.toLowerCase()}");
    expect(header).toContain('const [openDropdown, setOpenDropdown] = useState<string | null>(null)');
    expect(header).toContain("onKeyDown={handleDropdownKeyDown}");
    expect(header).toContain("aria-expanded={openDropdown === item.href}");
    expect(header).toContain("setOpenDropdown(null)");
  });

  it("uses the concise contact hero, branches, and lazy official Maps embeds", () => {
    const page = read("app/lien-he/page.tsx");
    const branch = read("components/contact/BranchLocation.tsx");
    const business = read("content/settings/business.json");

    expect(page).toContain(">Liên hệ Tùng Phát</h1>");
    expect(page).toContain("Tùng Phát cung cấp các loại vật liệu gồm gỗ ghép, MDF, MFC, Plywood và chỉ dán cạnh;");
    expect(page).toContain("0909 259 160 (Mr Tùng)");
    expect(page).toContain('const contactPhoneHref = "tel:0909259160"');
    expect(page).toContain('src="/images/cnc-service.webp"');
    expect(page).not.toContain('eyebrow="Tùng Phát tại Thủ Đức"');
    expect(page).not.toContain('eyebrow="Thông tin liên hệ"');
    expect(page).not.toContain("Gửi mã, quy cách hoặc file cần hỏi");
    expect(page).not.toContain("Xem hai chi nhánh");
    expect(page).not.toContain("Hệ thống tại Tam Bình");
    expect(branch).not.toContain("Dịch vụ có thể trao đổi tại chi nhánh");
    expect(branch).not.toContain("Xem chi tiết chi nhánh");
    expect(branch).not.toContain("Mở Google Maps");
    expect(branch).toContain('loading="lazy"');
    expect(branch).toContain("Xem trên Google Maps");
    expect(business).toContain("ChIJ6dw2A6YndTERr5eaiym-l-M");
    expect(business).toContain("ChIJjWMBUikndTERNFK1M-j02ZY");
  });
});
