import { describe, expect, it } from "vitest";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import {
  findExactCatalogCodeMatch,
  findExactSupplierMatch,
  humanizeCatalogLabel,
} from "@/lib/catalog/ui";
import {
  buildSupplierZaloInquiryUrl,
  supplierInquiryMessage,
} from "@/lib/catalog/inquiry";

const entries: CatalogSearchEntry[] = [
  {
    supplierId: "thanh-thuy",
    supplierName: "Thanh Thuỳ",
    kind: "product",
    code: "BT 111 Plus",
    name: "Bề mặt BT 111 Plus",
    canonicalRoute: "/san-pham/melamine/bt-111-plus/",
  },
  {
    supplierId: "ba-thanh",
    supplierName: "Ba Thanh",
    kind: "color-code",
    code: "BT 111",
    name: "Melamine Ba Thanh BT 111",
    canonicalRoute: "/ma-mau-melamine/ba-thanh/bt-111/",
  },
];

describe("catalogue presentation labels", () => {
  it.each([
    ["van-go", "Vân gỗ"],
    ["don-sac", "Đơn sắc"],
    ["pvc-film", "PVC Film"],
    ["Ván Dăm Phủ Melamine", "Ván Dăm Phủ Melamine"],
  ])("shows %s as %s", (value, expected) => {
    expect(humanizeCatalogLabel(value)).toBe(expected);
  });
});

describe("exact catalogue code interaction", () => {
  it.each(["BT111", "BT 111", "bt-111"])(
    "selects only the exact normalized code for %s",
    (query) => {
      expect(findExactCatalogCodeMatch(entries, query)?.canonicalRoute).toBe(
        "/ma-mau-melamine/ba-thanh/bt-111/",
      );
    },
  );

  it("does not navigate for a partial code", () => {
    expect(findExactCatalogCodeMatch(entries, "BT11")).toBeUndefined();
  });

  it("does not choose one supplier when an exact code is ambiguous", () => {
    expect(
      findExactCatalogCodeMatch(
        [
          ...entries,
          {
            ...entries[0],
            code: "BT 111",
            canonicalRoute: "/san-pham/melamine/bt-111/",
          },
        ],
        "BT111",
      ),
    ).toBeUndefined();
  });
});

describe("exact supplier interaction", () => {
  const suppliers = [
    { displayName: "Thanh Thuỳ", cataloguePath: "/thuong-hieu/thanh-thuy/" },
    { displayName: "Ba Thanh", cataloguePath: "/ma-mau-melamine/ba-thanh/" },
    { displayName: "An Cường", cataloguePath: "/catalogue/an-cuong/" },
  ];

  it.each(["Thanh Thuy", "Thanh Thuỳ", "thanh-thuy"])(
    "matches the supplier name for %s without requiring accents or spacing",
    (query) => {
      expect(findExactSupplierMatch(suppliers, query)?.cataloguePath).toBe(
        "/thuong-hieu/thanh-thuy/",
      );
    },
  );

  it("does not turn a partial supplier name into an exact match", () => {
    expect(findExactSupplierMatch(suppliers, "Thanh")).toBeUndefined();
  });
});

describe("supplier Zalo inquiry", () => {
  it("builds the approved code-specific message", () => {
    const message = supplierInquiryMessage("Ba Thanh", "BT 111");

    expect(message).toBe(
      "Tôi cần kiểm tra mã BT 111 của Ba Thanh tại Tùng Phát. Vui lòng tư vấn cốt ván, quy cách, tình trạng hàng và dịch vụ gia công phù hợp.",
    );
    expect(
      new URL(
        buildSupplierZaloInquiryUrl(
          "https://zalo.me/0909259160",
          "Ba Thanh",
          "BT 111",
        ),
      ).searchParams.get("text"),
    ).toBe(message);
  });

  it("builds a concise supplier-level message", () => {
    expect(supplierInquiryMessage("An Cường")).toBe(
      "Tôi cần tư vấn catalogue An Cường tại Tùng Phát.",
    );
  });
});
