import { describe, expect, it } from "vitest";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import {
  extractBaThanhIndex,
  recognizeBaThanhDetail,
  reconcileBaThanhCode,
} from "@/lib/catalog/ba-thanh-source";
import { isAllowedBaThanhUrl } from "@/lib/catalog/source-security";
import { isUrlAllowedByRobots } from "@/lib/catalog/robots-policy";
import {
  buildZaloInquiryUrl,
  mergeCatalogRecords,
} from "@/lib/catalog/import-utils";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { buildSourceChecksum } from "@/scripts/ba-thanh/import";
import {
  getBaThanhMerchandisingScore,
  searchBaThanhCodes,
} from "@/lib/catalog/ba-thanh";

describe("normalizeSupplierCode", () => {
  it.each([
    ["BT111", "BT 111", "bt-111"],
    ["BT 111", "BT 111", "bt-111"],
    ["BT-111", "BT 111", "bt-111"],
    ["Ba Thanh BT 111", "BT 111", "bt-111"],
    ["SC020M", "SC 020M", "sc-020m"],
    ["SC-020M", "SC 020M", "sc-020m"],
    ["SC017MW", "SC 017MW", "sc-017mw"],
    ["BT-A150", "BT A150", "bt-a150"],
  ])(
    "normalizes %s without losing meaningful suffixes",
    (raw, display, slug) => {
      expect(normalizeSupplierCode(raw)).toEqual({
        raw,
        normalized: display.replace(" ", ""),
        display,
        slug,
        confident: true,
      });
    },
  );

  it("keeps an ambiguous value reviewable instead of inventing a code", () => {
    expect(normalizeSupplierCode("SC 020 MATT")).toEqual({
      raw: "SC 020 MATT",
      normalized: "SC020MATT",
      display: "SC 020MATT",
      slug: "sc-020matt",
      confident: false,
    });
  });

  it("keeps named source codes searchable without treating them as verified numeric codes", () => {
    expect(normalizeSupplierCode("BT-XAM-CHI")).toEqual({
      raw: "BT-XAM-CHI",
      normalized: "BTXAMCHI",
      display: "BT XAM CHI",
      slug: "bt-xam-chi",
      confident: false,
    });
  });
});

describe("extractBaThanhIndex", () => {
  const html = `
    <nav><a href="https://bathanh.com.vn/tin-tuc"><img src="/news.jpg"></a></nav>
    <div class="vc_tta-tabs-list">
      <a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a>
      <a href="#solid"><span class="vc_tta-title-text">MÀU ĐƠN SẮC</span></a>
      <a href="#new"><span class="vc_tta-title-text">MÀU KIM LOẠI</span></a>
    </div>
    <div class="vc_tta-panel" id="wood">
      <a href="https://bathanh.com.vn/bt-111-wood-grains"><img width="2084" height="1251" src="https://bathanh.com.vn/uploads/BT111.jpg"></a>
    </div>
    <div class="vc_tta-panel" id="solid">
      <a href="/sc028"><img width="1000" height="600" src="/uploads/SC028M.jpg"></a>
    </div>
    <div class="vc_tta-panel" id="new">
      <a href="/metal-01"><img src="/uploads/MT01.jpg"></a>
    </div>
    <footer><a href="/lien-he"><img src="/logo.png"></a></footer>
  `;

  it("discovers categories from the DOM and ignores links outside catalogue panels", () => {
    const result = extractBaThanhIndex(
      html,
      "https://bathanh.com.vn/map-ma-melamine",
    );

    expect(result.categories.map((category) => category.sourceLabel)).toEqual([
      "MÀU VÂN GỖ",
      "MÀU ĐƠN SẮC",
      "MÀU KIM LOẠI",
    ]);
    expect(result.items).toEqual([
      expect.objectContaining({
        sourceUrl: "https://bathanh.com.vn/bt-111-wood-grains",
        sourceImageUrl: "https://bathanh.com.vn/uploads/BT111.jpg",
        category: "van-go",
        codeRaw: "BT111",
      }),
      expect.objectContaining({
        sourceUrl: "https://bathanh.com.vn/sc028",
        sourceImageUrl: "https://bathanh.com.vn/uploads/SC028M.jpg",
        category: "don-sac",
        codeRaw: "SC028M",
      }),
      expect.objectContaining({
        sourceUrl: "https://bathanh.com.vn/metal-01",
        category: "mau-kim-loai",
        codeRaw: "MT01",
      }),
    ]);
  });

  it("deduplicates desktop and accordion copies of the same category tab", () => {
    const duplicated = `
      <a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a>
      <div class="vc_tta-panel" id="wood"><h4><a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a></h4><a href="/bt111"><img src="/BT111.jpg"></a></div>
    `;
    expect(
      extractBaThanhIndex(duplicated, "https://bathanh.com.vn/map-ma-melamine")
        .categories,
    ).toHaveLength(1);
  });

  it("discovers multi-letter suffixes and named solid-color codes from source URLs", () => {
    const source = `
      <a href="#solid"><span class="vc_tta-title-text">MÀU ĐƠN SẮC</span></a>
      <div class="vc_tta-panel" id="solid">
        <a href="/sc017mw"><img src="/TAO-TEM-MAU-WEB-07.jpg"></a>
        <a href="/bt-xam-chi-solid-color"><img src="/BT-XAM-CHI.jpg"></a>
      </div>
    `;
    expect(
      extractBaThanhIndex(
        source,
        "https://bathanh.com.vn/map-ma-melamine",
      ).items.map((item) => item.codeRaw),
    ).toEqual(["SC017MW", "BT-XAM-CHI"]);
  });

  it("does not turn accordion hash anchors into colour-code records", () => {
    const source = `
      <a href="#solid"><span class="vc_tta-title-text">MÀU ĐƠN SẮC</span></a>
      <div class="vc_tta-panel" id="solid">
        <div class="vc_tta-panel-heading"><a href="#solid">MÀU ĐƠN SẮC</a></div>
        <a href="/sc028"><img src="/SC028M.jpg"></a>
      </div>
    `;
    expect(
      extractBaThanhIndex(
        source,
        "https://bathanh.com.vn/map-ma-melamine",
      ).items.map((item) => item.sourceUrl),
    ).toEqual(["https://bathanh.com.vn/sc028"]);
  });

  it("rejects non-HTTPS detail and image URLs during discovery", () => {
    const source = `
      <a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a>
      <div class="vc_tta-panel" id="wood">
        <a href="http://bathanh.com.vn/bt111"><img src="http://bathanh.com.vn/BT111.jpg"></a>
      </div>
    `;

    expect(
      extractBaThanhIndex(source, "https://bathanh.com.vn/map-ma-melamine")
        .items,
    ).toEqual([]);
  });

  it("discovers public WAY Laminate codes without treating WAY as part of the code", () => {
    const source = `
      <a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a>
      <a href="#solid"><span class="vc_tta-title-text">MÀU ĐƠN SẮC</span></a>
      <div class="vc_tta-panel" id="wood">
        <a href="/way-w7020"><img src="/uploads/W7020.jpg"></a>
      </div>
      <div class="vc_tta-panel" id="solid">
        <a href="/way-p1010"><img src="/uploads/P1010.jpg"></a>
      </div>
    `;

    expect(
      extractBaThanhIndex(
        source,
        "https://bathanh.com.vn/map-mau-laminate",
      ).items.map((item) => item.codeRaw),
    ).toEqual(["W7020", "P1010"]);
  });

  it("uses a WAY detail route code when the Laminate index reuses an unrelated Melamine thumbnail filename", () => {
    const source = `
      <a href="#wood"><span class="vc_tta-title-text">MÀU VÂN GỖ</span></a>
      <div class="vc_tta-panel" id="wood">
        <a href="/way-w0502"><img src="/wp-content/uploads/BT-163.jpg"></a>
      </div>
    `;

    expect(
      extractBaThanhIndex(
        source,
        "https://bathanh.com.vn/map-mau-laminate",
      ).items[0]?.codeRaw,
    ).toBe("W0502");
  });
});

describe("recognizeBaThanhDetail", () => {
  it("accepts a linked detail page only when its visible heading matches the expected code", () => {
    const html = `
      <title>MELAMINE BA THANH - BT 111</title>
      <main>
        <h1>MELAMINE BA THANH – BT 111</h1>
        <p>Hình ảnh chỉ mang tính tham khảo.</p>
        <img src="https://bathanh.com.vn/uploads/BT-111.jpg">
        <img src="https://bathanh.com.vn/uploads/BT-111-THUC-TE.jpg">
      </main>
      <footer><p>Tel: source phone</p><img src="/logo.png"></footer>
    `;

    const detail = recognizeBaThanhDetail(html, {
      expectedCode: "BT111",
      sourceUrl: "https://bathanh.com.vn/bt-111-wood-grains",
    });

    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("BT111");
    expect(detail.heading).toBe("MELAMINE BA THANH – BT 111");
    expect(detail.images).toEqual([
      "https://bathanh.com.vn/uploads/BT-111.jpg",
      "https://bathanh.com.vn/uploads/BT-111-THUC-TE.jpg",
    ]);
    expect(detail.text).not.toContain("source phone");
  });

  it("rejects unrelated or mismatched pages", () => {
    const detail = recognizeBaThanhDetail("<h1>Tin tức Ba Thanh</h1>", {
      expectedCode: "BT111",
      sourceUrl: "https://bathanh.com.vn/tin-tuc",
    });
    expect(detail.accepted).toBe(false);
  });

  it("rejects a Melamine detail heading for a different code", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – BT 143</h1></main>",
      {
        expectedCode: "BT111",
        sourceUrl: "https://bathanh.com.vn/bt-111-wood-grains",
      },
    );

    expect(detail.accepted).toBe(false);
  });

  it("uses the detail heading to preserve suffix variants missed by the index image", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – SC 018MW</h1><img src='/SC018MW.jpg'></main>",
      {
        expectedCode: "SC018",
        sourceUrl: "https://bathanh.com.vn/sc018mw",
      },
    );
    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("SC018MW");
  });

  it("reconciles legacy BTSC index codes with verified SC detail variants", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – SC 003MW</h1></main>",
      {
        expectedCode: "BTSC003",
        sourceUrl: "https://bathanh.com.vn/sc-003mw-solid-color",
      },
    );

    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("SC003MW");
  });

  it("recognizes Ba Thanh stone codes whose heading inserts the S collection marker", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – BT S14G</h1><img src='/S14.jpg'></main>",
      {
        expectedCode: "S14",
        sourceUrl: "https://bathanh.com.vn/bts14",
      },
    );
    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("BTS14G");
  });

  it("reconciles an S code that already carries the G suffix", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – BT S11G</h1></main>",
      {
        expectedCode: "S11G",
        sourceUrl: "https://bathanh.com.vn/bts11",
      },
    );

    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("BTS11G");
  });

  it("keeps named solid-color source codes when the heading uses a localized color name", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – XANH DƯƠNG</h1></main>",
      {
        expectedCode: "BT-XANH-BIEN",
        sourceUrl: "https://bathanh.com.vn/bt-xanh-bien-solid-color",
      },
    );
    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("BT-XANH-BIEN");
  });

  it("rejects a named solid-color page whose heading identifies a different color", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>MELAMINE BA THANH – ĐEN ASH</h1></main>",
      {
        expectedCode: "BT-XANH-BIEN",
        sourceUrl: "https://bathanh.com.vn/bt-xanh-bien-solid-color",
      },
    );

    expect(detail.accepted).toBe(false);
  });

  it("recognizes an alphanumeric Ba Thanh solid-color code", () => {
    const detail = recognizeBaThanhDetail(
      "<main><h1>BT A150 – SOLID COLOR</h1></main>",
      {
        expectedCode: "BT-A150",
        sourceUrl: "https://bathanh.com.vn/bt-a150-solid-color",
      },
    );
    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("BTA150");
  });

  it("keeps only detail content after the H1 when the legacy page has no main element", () => {
    const detail = recognizeBaThanhDetail(
      "<nav>VÁN MDF TIN TỨC</nav><h1>BT 184 – WOOD GRAINS</h1><p>MFC - BT 184 Size: 1220mm x 2440mm</p><footer>source contact</footer>",
      {
        expectedCode: "BT184",
        sourceUrl: "https://bathanh.com.vn/bt184",
      },
    );
    expect(detail.text).toContain("1220mm x 2440mm");
    expect(detail.text).not.toContain("TIN TỨC");
    expect(detail.text).not.toContain("source contact");
  });

  it("verifies a public Laminate WAY detail code from its visible heading", () => {
    const detail = recognizeBaThanhDetail(
      `<main>
        <h1>LAMINATE WAY W7020</h1>
        <p>Hình ảnh màu Laminate chụp thực tế.</p>
        <img src="https://bathanh.com.vn/wp-content/uploads/W7020-Z.jpg">
      </main>`,
      {
        expectedCode: "W7020",
        sourceUrl: "https://bathanh.com.vn/way-w7020",
      },
    );

    expect(detail).toEqual(expect.objectContaining({
      accepted: true,
      verifiedCodeRaw: "W7020",
      heading: "LAMINATE WAY W7020",
    }));
  });

  it("accepts the supplier's dash-separated Laminate heading without requiring a photo caption", () => {
    const detail = recognizeBaThanhDetail(
      `<main>
        <h1>LAMINATE – WAY – W7393</h1>
        <p>Hình ảnh chỉ mang tính tham khảo.</p>
      </main>`,
      {
        expectedCode: "W7393",
        sourceUrl: "https://bathanh.com.vn/way-w7393",
      },
    );

    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe("W7393");
  });

  it.each([
    ["SC032DL", "MELAMINE BA THANH – SC 032 DL", "MFC - BT SC 032 DL"],
    ["BT172EV", "BT 172EV – WOOD GRAINS", "MFC - BT 172EV"],
  ])("keeps the full multi-letter suffix for public code %s", (expectedCode, heading, body) => {
    const detail = recognizeBaThanhDetail(
      `<main><h1>${heading}</h1><p>${body}</p></main>`,
      { expectedCode, sourceUrl: `https://bathanh.com.vn/${expectedCode.toLowerCase()}` },
    );

    expect(detail.accepted).toBe(true);
    expect(detail.verifiedCodeRaw).toBe(expectedCode);
  });
});

describe("reconcileBaThanhCode", () => {
  it("keeps the index value for audit but uses a verified detail suffix as the identifier", () => {
    expect(reconcileBaThanhCode("SC018", "SC018MW")).toEqual({
      indexCodeRaw: "SC018",
      codeRaw: "SC018MW",
      codeNormalized: "SC018MW",
      displayName: "SC 018MW",
      slug: "sc-018mw",
      confident: true,
    });
  });
});

describe("source URL safety", () => {
  it("allows only HTTPS URLs on the Ba Thanh host", () => {
    expect(isAllowedBaThanhUrl("https://bathanh.com.vn/bt111")).toBe(true);
    expect(isAllowedBaThanhUrl("http://bathanh.com.vn/bt111")).toBe(false);
    expect(
      isAllowedBaThanhUrl(
        "https://evil.example/?next=https://bathanh.com.vn/bt111",
      ),
    ).toBe(false);
    expect(
      isAllowedBaThanhUrl("https://bathanh.com.vn.evil.example/bt111"),
    ).toBe(false);
  });

  it("honors the longest matching Allow and Disallow rule for the catalogue bot", () => {
    const robots = `
      User-agent: *
      Disallow: /private/
      Allow: /private/catalogue/

      User-agent: TungPhatCatalogueBot
      Disallow: /blocked/
    `;

    expect(
      isUrlAllowedByRobots(
        robots,
        "TungPhatCatalogueBot/1.0",
        "https://bathanh.com.vn/map-ma-melamine",
      ),
    ).toBe(true);
    expect(
      isUrlAllowedByRobots(
        robots,
        "TungPhatCatalogueBot/1.0",
        "https://bathanh.com.vn/blocked/code",
      ),
    ).toBe(false);
  });

  it("fails closed when a non-empty robots policy has no parseable user-agent group", () => {
    expect(
      isUrlAllowedByRobots(
        "Disallow /private",
        "TungPhatCatalogueBot/1.0",
        "https://bathanh.com.vn/map-ma-melamine",
      ),
    ).toBe(false);
  });

  it("enforces robots wildcard and end-anchor patterns", () => {
    const robots = "User-agent: *\nDisallow: /*?preview=$";
    expect(
      isUrlAllowedByRobots(
        robots,
        "TungPhatCatalogueBot/1.0",
        "https://bathanh.com.vn/bt111?preview=",
      ),
    ).toBe(false);
  });
});

describe("catalogue import merge", () => {
  const record: SupplierColorCode = {
    id: "ba-thanh:BT111",
    supplier: "ba-thanh",
    brandName: "Ba Thanh",
    codeRaw: "BT111",
    codeNormalized: "BT111",
    displayName: "BT 111",
    slug: "bt-111",
    category: "van-go",
    sourceUrl: "https://bathanh.com.vn/bt-111-wood-grains",
    sourceIndexUrl: "https://bathanh.com.vn/map-ma-melamine",
    sourceImportedAt: "2026-08-04T00:00:00.000Z",
    sourceChecksum: "source-a",
    sourceData: {},
    images: [],
    editorialDescription: "Nội dung biên tập của Tùng Phát.",
    seoStatus: "NEEDS_ENRICHMENT",
    published: false,
  };

  it("preserves editorial fields and reports an unchanged second import", () => {
    const incoming = { ...record, editorialDescription: undefined };
    const first = mergeCatalogRecords([], [incoming]);
    const second = mergeCatalogRecords(
      [
        {
          ...first.records[0],
          editorialDescription: record.editorialDescription,
        },
      ],
      [incoming],
    );

    expect(first.report).toEqual({
      created: 1,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      duplicates: 0,
    });
    expect(second.report).toEqual({
      created: 0,
      updated: 0,
      unchanged: 1,
      skipped: 0,
      duplicates: 0,
    });
    expect(second.records[0].editorialDescription).toBe(
      "Nội dung biên tập của Tùng Phát.",
    );
  });

  it("does not create two records for the same supplier and normalized code", () => {
    const result = mergeCatalogRecords(
      [],
      [record, { ...record, sourceUrl: "https://bathanh.com.vn/bt111" }],
    );
    expect(result.report.duplicates).toBe(1);
    expect(result.records).toHaveLength(1);
  });

  it("keeps the last valid published snapshot when a repeat import is incomplete", () => {
    const published = {
      ...record,
      seoStatus: "READY_TO_INDEX" as const,
      published: true,
      images: [
        {
          type: "swatch" as const,
          src: "/catalog/ba-thanh/bt-111.webp",
          alt: "Mẫu màu Melamine Ba Thanh mã BT 111",
        },
      ],
    };
    const incomplete = {
      ...record,
      sourceChecksum: "source-b",
      seoStatus: "MEDIA_MISSING" as const,
      published: false,
      images: [],
    };

    const result = mergeCatalogRecords([published], [incomplete]);

    expect(result.report).toEqual({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      duplicates: 0,
    });
    expect(result.records[0]).toEqual(published);
  });
});

describe("catalogue source checksum", () => {
  it("ignores dynamic raw-page checksum changes when parsed source facts are unchanged", () => {
    const source = {
      sourceUrl: "https://bathanh.com.vn/bt111",
      sourceImageUrl: "https://bathanh.com.vn/BT111.jpg",
      category: "van-go",
      sourceCategoryLabel: "MÀU VÂN GỖ",
      codeRaw: "BT111",
      codeNormalized: "BT111",
      displayName: "BT 111",
      slug: "bt-111",
      confident: true,
      heading: "BT 111 – WOOD GRAINS",
      text: "MFC - BT 111 Size: 1220mm x 2440mm",
      images: ["https://bathanh.com.vn/BT111-detail.jpg"],
    };

    expect(buildSourceChecksum({ ...source, pageChecksum: "dynamic-a" })).toBe(
      buildSourceChecksum({ ...source, pageChecksum: "dynamic-b" }),
    );
  });
});

describe("Ba Thanh merchandising", () => {
  it("puts editorially complete, high-intent codes before source A-Z order", () => {
    const ordered = searchBaThanhCodes("");

    expect(ordered[0].displayName).toBe("BT 111");
    expect(getBaThanhMerchandisingScore(ordered[0])).toBeGreaterThan(
      getBaThanhMerchandisingScore(
        ordered.find((record) => record.displayName === "BT 01")!,
      ),
    );
    expect(
      ordered.slice(0, 12).map((record) => record.displayName),
    ).not.toEqual(
      [...ordered]
        .sort((left, right) =>
          left.displayName.localeCompare(right.displayName, "vi"),
        )
        .slice(0, 12)
        .map((record) => record.displayName),
    );
  });

  it("keeps demand ordering inside a selected group", () => {
    expect(searchBaThanhCodes("", "van-go")[0].displayName).toBe("BT 111");
  });
});

describe("Zalo inquiry", () => {
  it("encodes the exact code-specific request without changing the business URL", () => {
    expect(buildZaloInquiryUrl("https://zalo.me/0909259160", "SC 020M")).toBe(
      "https://zalo.me/0909259160?text=T%C3%B4i+c%E1%BA%A7n+ki%E1%BB%83m+tra+m%C3%A3+SC+020M+c%E1%BB%A7a+Ba+Thanh+t%E1%BA%A1i+T%C3%B9ng+Ph%C3%A1t.+Vui+l%C3%B2ng+t%C6%B0+v%E1%BA%A5n+c%E1%BB%91t+v%C3%A1n%2C+quy+c%C3%A1ch%2C+t%C3%ACnh+tr%E1%BA%A1ng+h%C3%A0ng+v%C3%A0+d%E1%BB%8Bch+v%E1%BB%A5+gia+c%C3%B4ng+ph%C3%B9+h%E1%BB%A3p.",
    );
  });
});
