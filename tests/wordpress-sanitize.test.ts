import { describe, expect, it } from "vitest";
import { sanitizeWordPressHtml } from "@/lib/wordpress/sanitize";

const options = { mediaOrigins: ["https://wp.example.test"] };

describe("WordPress Gutenberg HTML boundary", () => {
  it("preserves supported editorial structure and approved media", () => {
    const html = '<h2>Heading</h2><p><strong>Bold</strong> <a href="/van-mdf/">MDF</a></p><figure class="wp-block-image"><img src="https://wp.example.test/wp-content/uploads/a.jpg" alt="ván" width="640" height="480"><figcaption>Caption</figcaption></figure><figure class="wp-block-table"><table><tbody><tr><td>A</td></tr></tbody></table></figure><blockquote><p>Text</p></blockquote><hr>';
    const result = sanitizeWordPressHtml(html, options);
    expect(result.html).toContain('<figcaption>Caption</figcaption>');
    expect(result.html).toContain('<td>A</td>');
    expect(result.html).toContain('src="https://wp.example.test/wp-content/uploads/a.jpg"');
    expect(result.html).toContain('href="/van-mdf/"');
    expect(result.warnings).toEqual([]);
  });

  it("removes executable content, unsafe URLs and styles while reporting unsupported blocks", () => {
    const result = sanitizeWordPressHtml('<p onclick="alert(1)" style="background:url(javascript:alert(1))">Safe<script>alert(1)</script><a href="javascript:alert(1)">x</a></p><svg onload="alert(1)"><path></path></svg><iframe src="https://evil.test"></iframe><img src="https://evil.test/a.jpg"><img src="https://wp.example.test/a.svg">', options);
    expect(result.html).not.toMatch(/script|onclick|style=|javascript:|<svg|<iframe|evil\.test|\.svg/i);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("does not allow protocol-relative or malformed media URLs", () => {
    const result = sanitizeWordPressHtml('<img src="//evil.test/a.jpg"><a href="&#x6a;avascript:alert(1)">bad</a><img src="https://wp.example.test.evil.test/a.jpg">', options);
    expect(result.html).not.toMatch(/src=|href=/);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

it("preserves local Playground media variants only with explicit loopback opt-in", () => {
  const html = '<figure><img src="http://127.0.0.1:9400/wp-content/uploads/a.png" srcset="http://127.0.0.1:9400/wp-content/uploads/a.png 640w, http://127.0.0.1:9400/wp-content/uploads/a-300.png 300w" sizes="auto, (max-width: 640px) 100vw, 640px" alt="sample"><figcaption>Caption</figcaption></figure>';
  expect(() => sanitizeWordPressHtml(html, { mediaOrigins: ["http://127.0.0.1:9400"] })).toThrow();
  const result = sanitizeWordPressHtml(html, { mediaOrigins: ["http://127.0.0.1:9400"], allowInsecureLoopback: true });
  expect(result.warnings).toEqual([]);
  expect(result.html).toContain('srcset="http://127.0.0.1:9400/');
  expect(result.html).toContain('<figcaption>Caption</figcaption>');
});

it("rejects a malicious candidate hidden in srcset", () => {
  const result = sanitizeWordPressHtml('<img src="https://wp.example.test/a.png" srcset="https://wp.example.test/a.png 640w, https://evil.test/a.png 300w">', { mediaOrigins: ["https://wp.example.test"] });
  expect(result.html).not.toContain('srcset=');
  expect(result.warnings).toContain("Unsafe image srcset removed");
});
