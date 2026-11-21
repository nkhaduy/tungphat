import { expect, test } from "@playwright/test";

test("Ba Thanh aliases and their targets retain their independent index policies", async ({ request }) => {
  for (const [path, canonical, robots] of [
    ["/ma-mau-melamine/ba-thanh/bt01/", "/catalogue/ba-thanh/melamine/bt01/", "noindex, follow"],
    ["/catalogue/ba-thanh/melamine/bt01/", "/catalogue/ba-thanh/melamine/bt01/", "noindex, follow"],
    ["/catalogue/ba-thanh/melamine/bt111/", "/catalogue/ba-thanh/melamine/bt111/", "index, follow"],
    ["/ma-mau-melamine/ba-thanh/don-sac/", "/catalogue/ba-thanh/melamine/", "noindex, follow"],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="https://mdftungphat.com${canonical}"`);
    expect(html).toContain(`name="robots" content="${robots}"`);
  }
});
