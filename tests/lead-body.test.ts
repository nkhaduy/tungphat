import { describe, expect, it } from "vitest";
import { readBoundedText } from "@/cloudflare-cms/src/leads/handler";

describe("bounded lead request body", () => {
  it("đọc payload trong giới hạn", async () => {
    const request = new Request("https://mdftungphat.com/api/contact", {
      method: "POST",
      body: new TextEncoder().encode('{"ok":true}')
    });
    await expect(readBoundedText(request, 20)).resolves.toEqual({
      text: '{"ok":true}',
      tooLarge: false
    });
  });

  it("dừng stream khi payload vượt giới hạn dù không dựa vào Content-Length", async () => {
    const request = new Request("https://mdftungphat.com/api/contact", {
      method: "POST",
      body: new TextEncoder().encode("123456")
    });
    await expect(readBoundedText(request, 5)).resolves.toEqual({
      text: "",
      tooLarge: true
    });
  });
});
