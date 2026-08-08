import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../functions/media/videos/[[path]]";

describe("Pages legacy media gateway", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preserves byte-range video responses without forwarding Access credentials", async () => {
    const legacyRequests: Request[] = [];
    vi.stubGlobal("fetch", async (request: Request) => {
      legacyRequests.push(request);
      return new Response("video-bytes", {
        status: 206,
        headers: { "Content-Type": "video/mp4", "Content-Range": "bytes 0-10/100" },
      });
    });
    const request = new Request("https://cms.example/media/videos/legacy/0619.mp4", {
      headers: {
        Range: "bytes=0-10",
        "Cf-Access-Jwt-Assertion": "signed.jwt.token",
        Cookie: "CF_Authorization=access-cookie; media_session=keep-me",
      },
    });

    const response = await onRequest({
      request,
      env: { LEGACY_CMS_ORIGIN: "https://immutable-legacy.pages.dev" },
    } as unknown as Parameters<typeof onRequest>[0]);

    expect(legacyRequests).toHaveLength(1);
    const forwarded = legacyRequests[0];
    expect(forwarded.url).toBe("https://immutable-legacy.pages.dev/media/videos/legacy/0619.mp4");
    expect(forwarded.headers.get("Range")).toBe("bytes=0-10");
    expect(forwarded.headers.get("Cf-Access-Jwt-Assertion")).toBeNull();
    expect(forwarded.headers.get("Cookie")).toBe("media_session=keep-me");
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 0-10/100");
    expect(await response.text()).toBe("video-bytes");
  });
});
