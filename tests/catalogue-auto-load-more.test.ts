import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AutoLoadMore } from "@/components/catalog/shared/AutoLoadMore";

describe("catalogue auto-load contract", () => {
  it("renders a near-bottom sentinel and an accessible loading status", () => {
    const markup = renderToStaticMarkup(
      createElement(AutoLoadMore, {
        hasMore: true,
        onLoadMore: () => undefined,
        remaining: 20,
        pageSize: 48,
      }),
    );

    expect(markup).toContain('data-testid="catalogue-load-sentinel"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Tải thêm 20 mã");
  });
});
