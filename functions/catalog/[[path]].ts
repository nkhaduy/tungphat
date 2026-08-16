const REPRESENTATIVE_WEBP =
  "UklGRioAAABXRUJQVlA4IB4AAABwAQCdASoBAAEAAUAmJZwCdAF1AAD++9nAa8sAAAA=";

const mediaHeaders = {
  "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
  "Content-Type": "image/webp",
  "X-Content-Type-Options": "nosniff",
};

function representativeMedia(): ArrayBuffer {
  const decoded = atob(REPRESENTATIVE_WEBP);
  const media = new ArrayBuffer(decoded.length);
  const bytes = new Uint8Array(media);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return media;
}

export const onRequest: PagesFunction<CloudflareEnv> = async ({ request }) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  return new Response(request.method === "HEAD" ? null : representativeMedia(), {
    status: 200,
    headers: mediaHeaders,
  });
};
