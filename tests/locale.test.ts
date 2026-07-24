import { describe, expect, it } from "vitest";
import {
  OPEN_GRAPH_LOCALE,
  SCHEMA_LANGUAGE,
  SITE_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@/lib/locale";
import { vi } from "@/lib/i18n";

describe("Vietnamese-only locale policy", () => {
  it("exposes Vietnamese as the only supported website language", () => {
    expect(SITE_LANGUAGE).toBe("vi");
    expect(SUPPORTED_LANGUAGES).toEqual(["vi"]);
    expect(SUPPORTED_LANGUAGES).not.toContain("en");
  });

  it("uses Vietnamese locale identifiers for metadata and existing schema fields", () => {
    expect(OPEN_GRAPH_LOCALE).toBe("vi_VN");
    expect(SCHEMA_LANGUAGE).toBe("vi-VN");
  });

  it("keeps Vietnamese Unicode and valid product acronyms in the UI copy", () => {
    expect(vi.navHome).toBe("Trang chủ");
    expect(vi.navCNC).toContain("CNC");
    expect(vi.siteTagline).toContain("Vật liệu gỗ");
  });
});
