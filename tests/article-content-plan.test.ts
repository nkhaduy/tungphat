import { describe, expect, it } from "vitest";
import { articleContentPlan } from "@/lib/article-content-plan";

describe("articleContentPlan", () => {
  it("continues to render legacy Markdown when no block content exists", () => {
    expect(articleContentPlan(false, false)).toEqual({ legacy: true, lexical: false });
  });

  it("keeps legacy Markdown visible while an existing article gains blocks", () => {
    expect(articleContentPlan(true, false)).toEqual({ legacy: true, lexical: true });
  });

  it("renders only blocks after the editor explicitly replaces legacy content", () => {
    expect(articleContentPlan(true, true)).toEqual({ legacy: false, lexical: true });
  });
});
