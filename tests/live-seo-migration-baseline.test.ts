import { describe, expect, it } from "vitest";
import { resolveContentMetadataCopy } from "@/lib/content-metadata";

describe("live SEO migration baseline", () => {
  it.each([
    {
      path: "/bai-viet/chuan-bi-file-cnc",
      title: "Chuẩn bị file CNC gỗ và MDF để gửi xưởng | Tùng Phát",
      description:
        "Chuẩn bị file CNC gỗ và MDF với đơn vị đo, vật liệu, độ dày, kích thước, số lượng, đường cắt, lỗ/rãnh và mặt gia công.",
    },
    {
      path: "/bai-viet/go-ghep-la-gi",
      title: "Gỗ ghép là gì? Cách nhìn tấm và chọn theo hạng mục | Tùng Phát",
      description:
        "Giải thích gỗ ghép là gì, cách nhìn hướng thanh, mối ghép, bề mặt và cạnh; gợi ý chọn cao su, tràm theo hạng mục và yêu cầu CNC.",
    },
    {
      path: "/bai-viet/mdf-thuong-va-chong-am",
      title: "MDF thường hay chống ẩm? Chọn theo môi trường | Tùng Phát",
      description:
        "So sánh MDF thường và MDF chống ẩm theo môi trường, hạng mục, cốt ván, bề mặt và cạnh; nhấn mạnh chống ẩm không đồng nghĩa chống nước.",
    },
  ])("keeps the live Vercel copy for $path", ({ path, title, description }) => {
    expect(
      resolveContentMetadataCopy({ seoTitle: "CMS title", seoDescription: "CMS description" }, path),
    ).toEqual({ title, description });
  });

  it("leaves metadata outside the migration baseline untouched", () => {
    expect(
      resolveContentMetadataCopy({ seoTitle: "MDF", seoDescription: "Mô tả MDF" }, "/van-mdf"),
    ).toEqual({ title: "MDF", description: "Mô tả MDF" });
  });
});
