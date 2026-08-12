const canonicalOrigin = "https://mdftungphat.com";
const permanentStatus = 308;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const mappings = [
  { legacyPath: "/gia-cong-cnc-go", destinationPath: "/cat-cnc-go/" },
  { legacyPath: "/gia-cong-cnc-go/", destinationPath: "/cat-cnc-go/" },
  { legacyPath: "/cnc-mdf", destinationPath: "/gia-cong-cnc-mdf/" },
  { legacyPath: "/cnc-mdf/", destinationPath: "/gia-cong-cnc-mdf/" },
  { legacyPath: "/danh-muc-san-pham/van-cong-nghiep", destinationPath: "/van-go-cong-nghiep/" },
  { legacyPath: "/danh-muc-san-pham/van-cong-nghiep/", destinationPath: "/van-go-cong-nghiep/" },
  { legacyPath: "/danh-muc-san-pham/go-ghep", destinationPath: "/go-ghep/" },
  { legacyPath: "/danh-muc-san-pham/go-ghep/", destinationPath: "/go-ghep/" },
  { legacyPath: "/danh-muc-san-pham/van-mdf", destinationPath: "/van-mdf/" },
  { legacyPath: "/danh-muc-san-pham/van-mdf/", destinationPath: "/van-mdf/" },
  { legacyPath: "/danh-muc-san-pham/van-ep", destinationPath: "/van-go-cong-nghiep/" },
  { legacyPath: "/danh-muc-san-pham/van-ep/", destinationPath: "/van-go-cong-nghiep/" },
  { legacyPath: "/san-pham/van-mdf-tron", destinationPath: "/van-mdf/" },
  { legacyPath: "/san-pham/van-mdf-tron/", destinationPath: "/van-mdf/" },
  { legacyPath: "/danh-muc-san-pham/tung-phat", destinationPath: "/" },
  { legacyPath: "/danh-muc-san-pham/tung-phat/", destinationPath: "/" },
  { legacyPath: "/danh-muc-san-pham/go-ghep-thanh", destinationPath: "/go-ghep/" },
  { legacyPath: "/danh-muc-san-pham/go-ghep-thanh/", destinationPath: "/go-ghep/" },
  { legacyPath: "/san-pham/go-ghep-thanh", destinationPath: "/go-ghep/" },
  { legacyPath: "/san-pham/go-ghep-thanh/", destinationPath: "/go-ghep/" },
  {
    legacyPath: "/go-ghep-go-ghep-thanh-la-gi-dac-diem-ung-dung-quy-trinh-san-xuat",
    destinationPath: "/bai-viet/go-ghep-la-gi/",
  },
  {
    legacyPath: "/go-ghep-go-ghep-thanh-la-gi-dac-diem-ung-dung-quy-trinh-san-xuat/",
    destinationPath: "/bai-viet/go-ghep-la-gi/",
  },
];

const runtimeOrigin = process.env.LEGACY_REDIRECT_CHECK_ORIGIN ?? process.argv[2];

if (!runtimeOrigin) {
  console.error(
    "Thiếu LEGACY_REDIRECT_CHECK_ORIGIN. Hãy chạy validator với Vercel local runtime, ví dụ LEGACY_REDIRECT_CHECK_ORIGIN=http://127.0.0.1:4173 npm run validate:legacy-redirects.",
  );
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeOrigin);
} catch {
  console.error(`LEGACY_REDIRECT_CHECK_ORIGIN không hợp lệ: ${runtimeOrigin}`);
  process.exit(1);
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3],
    ]),
  );
}

function metadata(html) {
  const tags = [...html.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map((match) => attributes(match[0]));
  return {
    canonicals: tags.filter((tag) => tag.rel?.toLowerCase() === "canonical"),
    robots: tags.filter((tag) => tag.name?.toLowerCase() === "robots"),
  };
}

async function manualRequest(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { Accept: "text/html" },
  });
  return {
    response,
    status: response.status,
    location: response.headers.get("location"),
  };
}

async function traceRedirects(startUrl, maxHops = 8) {
  const trace = [];
  const seen = new Set();
  let current = new URL(startUrl);

  for (let hop = 0; hop <= maxHops; hop += 1) {
    if (seen.has(current.href)) return { trace, loop: current.href, exceeded: false };
    seen.add(current.href);

    const result = await manualRequest(current);
    trace.push({ url: current.href, status: result.status, location: result.location });
    if (!redirectStatuses.has(result.status) || !result.location) {
      return { trace, loop: null, exceeded: false };
    }
    current = new URL(result.location, current);
  }

  return { trace, loop: null, exceeded: true };
}

function formatResponse(pathname, status, location) {
  return `${pathname}: status=${status}, Location=${location ?? "-"}`;
}

const errors = [];
const results = [];
const destinationChecks = new Map();

for (const mapping of mappings) {
  const requestUrl = new URL(mapping.legacyPath, origin);
  const direct = await manualRequest(requestUrl);
  const locationUrl = direct.location ? new URL(direct.location, requestUrl) : null;

  if (direct.status !== permanentStatus) {
    errors.push(`${formatResponse(mapping.legacyPath, direct.status, direct.location)}; cần HTTP ${permanentStatus}.`);
  }
  if (!locationUrl || locationUrl.pathname !== mapping.destinationPath || locationUrl.search || locationUrl.hash) {
    errors.push(
      `${formatResponse(mapping.legacyPath, direct.status, direct.location)}; cần trỏ thẳng tới ${mapping.destinationPath}.`,
    );
  }
  if (locationUrl && locationUrl.pathname === `${mapping.legacyPath.replace(/\/$/, "")}/`) {
    errors.push(`${formatResponse(mapping.legacyPath, direct.status, direct.location)}; không chấp nhận hop thêm trailing slash cho legacy URL.`);
  }

  const trace = await traceRedirects(requestUrl);
  if (trace.loop) errors.push(`${mapping.legacyPath}: phát hiện redirect loop tại ${trace.loop}.`);
  if (trace.exceeded) errors.push(`${mapping.legacyPath}: vượt quá giới hạn redirect khi kiểm tra loop.`);
  if (trace.trace.length !== 2 || trace.trace[1]?.status !== 200) {
    errors.push(
      `${mapping.legacyPath}: cần đúng 1 hop tới destination HTTP 200; trace=${trace.trace
        .map((hop) => `${hop.status} ${hop.url} -> ${hop.location ?? "-"}`)
        .join(" | ")}`,
    );
  }

  results.push({
    legacyPath: mapping.legacyPath,
    status: direct.status,
    location: direct.location,
    hops: Math.max(0, trace.trace.length - 1),
    destinationStatus: trace.trace[1]?.status ?? 0,
  });

  if (!destinationChecks.has(mapping.destinationPath)) {
    destinationChecks.set(mapping.destinationPath, new URL(mapping.destinationPath, origin));
  }
}

for (const [destinationPath, destinationUrl] of destinationChecks) {
  const { response, status, location } = await manualRequest(destinationUrl);
  if (status !== 200 || location) {
    errors.push(`${formatResponse(destinationPath, status, location)}; destination phải trả HTTP 200 trực tiếp.`);
    continue;
  }

  const html = await response.text();
  const pageMetadata = metadata(html);
  const expectedCanonical = new URL(destinationPath, canonicalOrigin).href;
  const canonicalHrefs = pageMetadata.canonicals.map((tag) => tag.href);
  if (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical) {
    errors.push(
      `${destinationPath}: cần đúng một self-canonical ${expectedCanonical}; nhận ${canonicalHrefs.length} canonical (${canonicalHrefs.join(", ") || "-"}).`,
    );
  }

  const robotsValues = pageMetadata.robots.map((tag) => tag.content ?? "");
  const xRobotsTag = response.headers.get("x-robots-tag") ?? "";
  if ([...robotsValues, xRobotsTag].some((value) => /(?:^|\s*,\s*)noindex(?:\s*,\s*|$)/i.test(value))) {
    errors.push(`${destinationPath}: robots không được chứa noindex; meta=${robotsValues.join(" | ") || "-"}, X-Robots-Tag=${xRobotsTag || "-"}.`);
  }
}

if (errors.length > 0) {
  console.error(`Legacy redirect validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

for (const result of results) {
  console.log(
    `${result.legacyPath}: ${result.status} -> ${result.location}; ${result.hops} hop; destination HTTP ${result.destinationStatus}`,
  );
}
console.log(
  `Legacy redirect validation pass: ${mappings.length}/${mappings.length} path redirect vĩnh viễn trực tiếp; ${destinationChecks.size}/${destinationChecks.size} destination HTTP 200, self-canonical, indexable; 0 loop.`,
);
