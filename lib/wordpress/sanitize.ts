import sanitizeHtml from "sanitize-html";

const tags = ["p", "h2", "h3", "h4", "strong", "b", "em", "i", "a", "ul", "ol", "li", "img", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "blockquote", "hr", "br"];
const allowed = new Set(tags);

function safeLink(value: string): boolean {
  if (/^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

function safeImage(value: string, origins: Set<string>, allowInsecureLoopback: boolean): boolean {
  if (/[\\\u0000-\u0020]/.test(value)) return false;
  try {
    const url = new URL(value, "https://mdftungphat.com");
    if (value.startsWith("//") || !(url.protocol === "https:" || (allowInsecureLoopback && url.protocol === "http:" && url.hostname === "127.0.0.1")) || url.username || url.password || !origins.has(url.origin)) return false;
    return !/\.svg(?:$|[?#])/i.test(url.pathname + url.search + url.hash);
  } catch { return false; }
}

/** Sanitize untrusted Gutenberg output. Callers must review warnings and fail
 * publication on content loss; this function is not a block parity check. */
export function sanitizeWordPressHtml(input: string, options: { mediaOrigins: string[]; allowInsecureLoopback?: boolean }): { html: string; warnings: string[] } {
  const warnings = new Set<string>();
  const origins = new Set(["https://mdftungphat.com", ...options.mediaOrigins.map((origin) => {
    const url = new URL(origin);
    if (!(url.protocol === "https:" || (options.allowInsecureLoopback && url.protocol === "http:" && url.hostname === "127.0.0.1")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Invalid WordPress media origin");
    return url.origin;
  })]);
  const html = sanitizeHtml(input, {
    allowedTags: tags,
    allowedAttributes: { a: ["href", "title"], img: ["src", "srcset", "sizes", "alt", "width", "height"], th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"], ol: ["start"] },
    allowedSchemes: ["https", "http"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      "*": (tagName, attributes) => {
        if (!allowed.has(tagName)) warnings.add(`Unsupported element: ${tagName}`);
        if (tagName === "a" && attributes.href && !safeLink(attributes.href)) { delete attributes.href; warnings.add("Unsafe link removed"); }
        if (tagName === "img" && (!attributes.src || !safeImage(attributes.src, origins, Boolean(options.allowInsecureLoopback)))) { delete attributes.src; warnings.add("Unsafe image removed"); }
        if (tagName === "img" && attributes.srcset) {
          const candidates = attributes.srcset.split(",");
          const valid = candidates.every((candidate) => {
            const match = candidate.trim().match(/^(\S+)\s+(?:[1-9]\d*w|(?:\d+(?:\.\d+)?)x)$/);
            return Boolean(match && safeImage(match[1], origins, Boolean(options.allowInsecureLoopback)));
          });
          if (!valid) { delete attributes.srcset; warnings.add("Unsafe image srcset removed"); }
        }
        if (tagName === "img" && attributes.sizes && !/^[\w\s(),.:+%\-/]+$/.test(attributes.sizes)) { delete attributes.sizes; warnings.add("Unsafe image sizes removed"); }
        return { tagName, attribs: attributes };
      },
    },
  });
  return { html, warnings: [...warnings] };
}
