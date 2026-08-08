import { describe, expect, it, vi } from "vitest";
import { emptyRow, parseQuantityInput, pasteGridText } from "../src/client/components/QuoteGrid";
import { HttpError } from "../src/worker/http";
import { validateRasterImage } from "../src/worker/images";
import { fetchBounded } from "../src/worker/pdf";

function pngHeader(width = 1, height = 1): ArrayBuffer {
  const buffer = new ArrayBuffer(24);
  const bytes = new Uint8Array(buffer);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return buffer;
}

describe("spreadsheet paste", () => {
  it("parses Vietnamese decimal input and pastes multiple Excel rows/columns", () => {
    expect(parseQuantityInput("1,25")).toBe(1.25);
    const rows = pasteGridText([emptyRow()], "Ván MDF\t18 mm\t1,5\tm²\t203001\tGhi chú\nCắt CNC\tTheo file\t2\tbộ\t350000", 0, 0);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ productName: "Ván MDF", specification: "18 mm", quantity: 1.5, unit: "m²", unitPrice: 203_001, note: "Ghi chú" });
    expect(rows[1]).toMatchObject({ productName: "Cắt CNC", quantity: 2, unitPrice: 350_000 });
  });
});

describe("server-side raster validation", () => {
  it("rejects MIME spoofing, SVG and oversized raster dimensions", () => {
    const png = pngHeader();
    expect(validateRasterImage(png, "image/png")).toMatchObject({ contentType: "image/png", width: 1, height: 1 });
    expect(() => validateRasterImage(png, "image/jpeg")).toThrow(/MIME/);
    expect(() => validateRasterImage(new TextEncoder().encode("<svg><script>alert(1)</script></svg>").buffer, "image/svg+xml")).toThrow(/PNG hoặc JPEG/);
    expect(() => validateRasterImage(pngHeader(7_000, 7_000), "image/png")).toThrow(/Kích thước/);
  });
});

describe("bounded VietQR fetch", () => {
  it("accepts only vietqr.app and a real matching raster MIME", async () => {
    const fetcher: typeof fetch = vi.fn(() => Promise.resolve(new Response(pngHeader(), { status: 200, headers: { "Content-Type": "image/png" } })));
    const result = await fetchBounded("https://vietqr.app/img?acc=3191158", 1024, fetcher, 100);
    expect(result.contentType).toBe("image/png");
    expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: "manual" }));
    await expect(fetchBounded("https://evil.example/img", 1024, fetcher, 100)).rejects.toMatchObject({ status: 502 });
  });

  it("rejects redirects, non-images, oversized streams and timeouts as upstream failures", async () => {
    const redirect: typeof fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 302, headers: { Location: "https://evil.example" } })));
    await expect(fetchBounded("https://vietqr.app/img", 1024, redirect, 100)).rejects.toMatchObject({ status: 502 });

    const html: typeof fetch = vi.fn(() => Promise.resolve(new Response("not an image", { headers: { "Content-Type": "text/html" } })));
    await expect(fetchBounded("https://vietqr.app/img", 1024, html, 100)).rejects.toMatchObject({ status: 502 });

    const tooLarge: typeof fetch = vi.fn(() => Promise.resolve(new Response(new ArrayBuffer(2048), { headers: { "Content-Type": "image/png" } })));
    await expect(fetchBounded("https://vietqr.app/img", 1024, tooLarge, 100)).rejects.toMatchObject({ status: 502 });

    const hanging = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }));
    await expect(fetchBounded("https://vietqr.app/img", 1024, hanging, 10)).rejects.toEqual(expect.any(HttpError));
  });
});
