import { describe, expect, it } from "vitest";
import { selectBaThanhDetailMedia } from "@/scripts/ba-thanh/detail-media";

describe("Ba Thanh detail-page media selection", () => {
  it("uses clean Melamine detail media and never the branded map thumbnail", () => {
    const selected = selectBaThanhDetailMedia({
      codeNormalized: "BT163",
      materialType: "melamine",
      sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/2023/09/BT-163.jpg",
      detailImageUrls: [
        "https://bathanh.com.vn/wp-content/uploads/2023/05/BT-163.jpg",
        "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-163-01-1.jpg",
        "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-163-02-1.jpg",
        "https://bathanh.com.vn/wp-content/uploads/2024/04/BT-163-MAU-THUC-TE-MELAMINE.jpg",
      ],
    });

    expect(selected).toEqual([
      { sourceUrl: "https://bathanh.com.vn/wp-content/uploads/2023/05/BT-163.jpg", role: "swatch" },
      { sourceUrl: "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-163-01-1.jpg", role: "application" },
      { sourceUrl: "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-163-02-1.jpg", role: "application" },
      { sourceUrl: "https://bathanh.com.vn/wp-content/uploads/2024/04/BT-163-MAU-THUC-TE-MELAMINE.jpg", role: "actual-photo" },
    ]);
  });

  it("drops a detail image that is only a branded Ba Thanh template", () => {
    expect(selectBaThanhDetailMedia({
      codeNormalized: "SC013MW",
      materialType: "melamine",
      sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/2024/03/TAO-TEM-MAU-WEB-05.jpg",
      detailImageUrls: ["https://bathanh.com.vn/wp-content/uploads/2024/03/TAO-TEM-MAU-WEB-05.jpg"],
    })).toEqual([]);
  });

  it("drops known wrong-code and coming-soon placeholders", () => {
    expect(selectBaThanhDetailMedia({
      codeNormalized: "SC028MW",
      materialType: "melamine",
      sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-103-e1698733774228.jpg",
      detailImageUrls: ["https://bathanh.com.vn/wp-content/uploads/2023/10/BT-103-e1698733774228.jpg"],
    })).toEqual([]);
    expect(selectBaThanhDetailMedia({
      codeNormalized: "SC032DL",
      materialType: "melamine",
      sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/07/soon-01.png",
      detailImageUrls: ["https://bathanh.com.vn/wp-content/uploads/2017/07/soon-01.png"],
    })).toEqual([]);
  });

  it("rejects a shared printed-code fallback for a WAY route", () => {
    expect(selectBaThanhDetailMedia({
      codeNormalized: "P2052",
      materialType: "laminate",
      sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/2024/04/SC017MW.jpg",
      detailImageUrls: [
        "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-01-e1713865269229.jpg",
        "https://bathanh.com.vn/wp-content/uploads/2024/04/SC-017-MW.jpg",
      ],
    })).toEqual([]);
  });
});
