import { describe, expect, it } from "vitest";
import { PIPELINE_STEPS, parseCliArgs } from "@/scripts/ancuong/cli";

describe("An Cuong CLI", () => {
  it("parses every supported shared option", () => {
    const parsed = parseCliArgs([
      "discover",
      "--dry-run",
      "--resume",
      "--force",
      "--category=melamine",
      "--product=303003307",
      "--limit=5",
      "--concurrency=2",
      "--changed-only",
      "--skip-media",
      "--verbose"
    ]);
    expect(parsed).toEqual({
      command: "discover",
      options: {
        dryRun: true,
        resume: true,
        force: true,
        category: "melamine",
        product: "303003307",
        limit: 5,
        concurrency: 2,
        changedOnly: true,
        skipMedia: true,
        verbose: true
      }
    });
  });

  it("rejects unsafe concurrency and unknown options", () => {
    expect(() => parseCliArgs(["discover", "--concurrency=0"])).toThrow(/concurrency/i);
    expect(() => parseCliArgs(["discover", "--unknown"])).toThrow(/unknown/i);
  });

  it("orders normalization before media so media receives normalized image URLs", () => {
    expect(PIPELINE_STEPS).toEqual([
      "discover", "crawl:non-numeric", "crawl:product-lines", "crawl:listings", "crawl:details", "crawl:relations", "normalize", "media", "validate", "diff", "export", "report"
    ]);
  });
});
