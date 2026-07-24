import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const CANONICAL_ORIGIN = "https://mdftungphat.com";
const EXPECTED_PROTECTED_HASH = "ee572e5e90440382d341ec9480a728b047997ed305981e2227043d58db82b9c2";
const EXPECTED_QUOTE_APP = {
  fileCount: 14252,
  bytes: 560715133,
  sha256: "cfc8239b063d49cc8f1b15654b5994fe106eeea4602dfac041958c95a0f2fc8b",
};
const EXCLUDED_ROUTES = new Set(["/404.html", "/404/", "/cms-preview/"]);
const REPRESENTATIVE_ROUTES = [
  "/",
  "/van-mdf/",
  "/go-ghep/",
  "/cat-cnc-go/",
  "/bai-viet/",
  "/lien-he/",
  "/san-pham/an-cuong/",
];
const VI_NAVIGATION_LABELS = ["Trang chủ", "Sản phẩm", "Gia công CNC", "Thư viện", "Liên hệ"];
const LANGUAGE_CONTROL_PATTERN = /(?:chuyển|đổi|change|switch).{0,20}(?:ngôn ngữ|language)|\bVI\s*\|\s*EN\b/iu;

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const outputDirectory = path.resolve(option("--out") ?? "out");
const runtimeOrigin = option("--origin")?.replace(/\/$/u, "");
const runtimeLabel = option("--label") ?? (runtimeOrigin ? "runtime" : "static export");
const browserMode = process.argv.includes("--browser");
const jsonOutput = process.argv.includes("--json");
const errors = [];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : entry.isFile() ? [absolute] : [];
  });
}

function stableFileHash(files) {
  return sha256(
    files
      .slice()
      .sort()
      .map((file) => `${file}\t${sha256(readFileSync(file))}`)
      .join("\n"),
  );
}

function protectedFiles() {
  return [
    "app/sitemap.ts",
    "lib/listing-indexability.ts",
    "lib/social-images.ts",
    ...walkFiles("components/content"),
    ...walkFiles("content"),
  ];
}

function quoteAppManifest() {
  const files = walkFiles(path.resolve("quote-app")).sort();
  let bytes = 0;
  let manifest = "";
  for (const file of files) {
    const content = readFileSync(file);
    bytes += content.byteLength;
    const relative = path.relative(process.cwd(), file).split(path.sep).join("/");
    manifest += `${sha256(content)}  ${relative}\n`;
  }
  return { fileCount: files.length, bytes, sha256: sha256(manifest) };
}

function routeForFile(file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"/index.html".length)}/`;
  return `/${relative}`;
}

function publicHtmlFiles() {
  if (!existsSync(outputDirectory)) throw new Error(`Không tìm thấy static export: ${outputDirectory}`);
  return walkFiles(outputDirectory)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !EXCLUDED_ROUTES.has(routeForFile(file)))
    .sort();
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/gu)].map((match) => [
      match[1].toLowerCase(),
      decodeHtml(match[2] ?? match[3] ?? ""),
    ]),
  );
}

function plainText(value) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
      .replace(/\s+/gu, " ")
      .trim(),
  );
}

function pageAudit(html, route) {
  const htmlTags = [...html.matchAll(/<html\b[^>]*>/giu)].map((match) => attributes(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/giu)].map((match) => attributes(match[0]));
  const metas = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) => attributes(match[0]));
  const anchors = [...html.matchAll(/<a\b[^>]*>/giu)].map((match) => attributes(match[0]));
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/giu)].map((match) => ({
    attributes: attributes(match[0].match(/<button\b[^>]*>/iu)?.[0] ?? ""),
    text: plainText(match[0]),
  }));
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/giu)].map((match) => plainText(match[1]));
  const title = plainText(html.match(/<title>([\s\S]*?)<\/title>/iu)?.[1] ?? "");
  const description = metas.find((meta) => meta.name?.toLowerCase() === "description")?.content ?? "";
  const robots = metas.find((meta) => meta.name?.toLowerCase() === "robots")?.content ?? "";
  const canonical = links.find((link) => link.rel?.toLowerCase() === "canonical")?.href ?? "";
  const ogLocales = metas
    .filter((meta) => meta.property?.toLowerCase() === "og:locale")
    .map((meta) => meta.content ?? "");
  const alternates = links.filter((link) => link.rel?.toLowerCase() === "alternate");
  const languageControls = buttons.filter(({ attributes: values, text }) =>
    LANGUAGE_CONTROL_PATTERN.test(`${values["aria-label"] ?? ""} ${text}`),
  );
  const localeQueryLinks = anchors.filter(({ href = "" }) => {
    try {
      const url = new URL(href, CANONICAL_ORIGIN);
      return url.searchParams.get("lang")?.toLowerCase() === "en";
    } catch {
      return false;
    }
  });
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/iu)?.[1] ?? "";
  const jsonLd = [...html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)]
    .map((match) => match[1]);

  if (htmlTags.length !== 1) errors.push(`${route}: cần đúng một thẻ <html>, nhận ${htmlTags.length}.`);
  if (htmlTags[0]?.lang !== "vi") errors.push(`${route}: html lang phải là vi, nhận '${htmlTags[0]?.lang ?? "-"}'.`);
  if (!title) errors.push(`${route}: title rỗng.`);
  if (!description) errors.push(`${route}: description rỗng.`);
  if (!canonical) errors.push(`${route}: canonical rỗng.`);
  if (!robots) errors.push(`${route}: robots rỗng.`);
  if (h1.length !== 1 || !h1[0]) errors.push(`${route}: cần đúng một H1 có nội dung, nhận ${h1.length}.`);
  if (ogLocales.length !== 1 || ogLocales[0] !== "vi_VN") {
    errors.push(`${route}: og:locale phải có đúng một giá trị vi_VN, nhận ${JSON.stringify(ogLocales)}.`);
  }
  if (languageControls.length) errors.push(`${route}: còn language control trong HTML.`);
  if (localeQueryLinks.length) errors.push(`${route}: còn link ?lang=en.`);
  if (alternates.some((link) => /^(?:en|en-)/iu.test(link.hreflang ?? ""))) {
    errors.push(`${route}: còn hreflang English.`);
  }
  if (alternates.some((link) => /\/en(?:\/|$)/iu.test(link.href ?? ""))) {
    errors.push(`${route}: còn alternate trỏ /en/.`);
  }
  if (!VI_NAVIGATION_LABELS.every((label) => plainText(header).includes(label))) {
    errors.push(`${route}: navigation tiếng Việt không đầy đủ.`);
  }
  if (!anchors.some((anchor) => anchor.href === "tel:+84909259160")) {
    errors.push(`${route}: thiếu CTA điện thoại hiện hữu.`);
  }
  if (!anchors.some((anchor) => anchor.href === "https://zalo.me/0909259160")) {
    errors.push(`${route}: thiếu CTA Zalo hiện hữu.`);
  }
  for (const [index, block] of jsonLd.entries()) {
    try {
      const value = JSON.parse(decodeHtml(block));
      const serialized = JSON.stringify(value);
      if (/"inLanguage":"en(?:-|")/iu.test(serialized)) {
        errors.push(`${route}: JSON-LD block ${index + 1} còn inLanguage English.`);
      }
    } catch (error) {
      errors.push(`${route}: JSON-LD block ${index + 1} parse lỗi: ${error.message}`);
    }
  }

  return {
    route,
    htmlLang: htmlTags[0]?.lang ?? "",
    title,
    description,
    canonical,
    robots,
    h1: h1[0] ?? "",
    ogLocale: ogLocales[0] ?? "",
    alternates: alternates.length,
    languageControls: languageControls.length,
  };
}

async function directRequest(route) {
  const response = await fetch(new URL(route, runtimeOrigin), { redirect: "manual" });
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: await response.text(),
  };
}

async function browserSnapshot(browser, route, viewport, staleEnglish) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  await page.addInitScript(({ stale }) => {
    if (stale) localStorage.setItem("tungphat-lang", "en");
    window.__languageAudit = { storageMutations: [], cls: 0 };
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function auditedSetItem(key, value) {
      if (/(?:^|[-_.])(lang|language|locale)(?:$|[-_.])/i.test(String(key))) {
        window.__languageAudit.storageMutations.push({ action: "set", key: String(key), value: String(value) });
      }
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function auditedRemoveItem(key) {
      if (/(?:^|[-_.])(lang|language|locale)(?:$|[-_.])/i.test(String(key))) {
        window.__languageAudit.storageMutations.push({ action: "remove", key: String(key) });
      }
      return removeItem.call(this, key);
    };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__languageAudit.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  }, { stale: staleEnglish });

  const response = await page.goto(new URL(route, runtimeOrigin).href, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  if (!response || response.status() !== 200) {
    errors.push(`${runtimeLabel} ${route}: browser HTTP ${response?.status() ?? "-"}.`);
  }

  const collect = async () => page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const languageControls = [...document.querySelectorAll("button, a")].filter((element) => {
      const value = `${element.getAttribute("aria-label") ?? ""} ${element.textContent ?? ""}`;
      return /(?:chuyển|đổi|change|switch).{0,20}(?:ngôn ngữ|language)|\bVI\s*\|\s*EN\b/iu.test(value);
    });
    const languageStorage = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && /(?:^|[-_.])(lang|language|locale)(?:$|[-_.])/i.test(key)) {
        languageStorage[key] = localStorage.getItem(key);
      }
    }
    const languageCookies = document.cookie
      .split(";")
      .map((value) => value.trim())
      .filter((value) => /(?:^|[-_.])(lang|language|locale)(?:=|[-_.])/i.test(value));
    return {
      url: location.href,
      htmlLang: document.documentElement.lang,
      title: document.title,
      h1: text("h1"),
      mainText: text("main"),
      headerText: text("header"),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
      ogLocale: document.querySelector('meta[property="og:locale"]')?.content ?? "",
      languageControls: languageControls.length,
      languageStorage,
      languageCookies,
      storageMutations: window.__languageAudit.storageMutations,
      cls: window.__languageAudit.cls,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const initial = await collect();
  if (viewport.width < 1024) {
    const menu = page.getByRole("button", { name: "Mở menu" });
    if (await menu.count() !== 1) {
      errors.push(`${runtimeLabel} ${route} mobile: không tìm thấy đúng một nút Mở menu.`);
    } else {
      await menu.click();
      const openState = await collect();
      if (openState.languageControls) errors.push(`${runtimeLabel} ${route} mobile: drawer còn language control.`);
      const closeMenu = page.getByRole("button", { name: "Đóng menu" });
      if (await closeMenu.count() !== 1) errors.push(`${runtimeLabel} ${route} mobile: menu không mở đúng.`);
      else {
        await closeMenu.click();
        const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
        if (focusedLabel !== "Mở menu") errors.push(`${runtimeLabel} ${route} mobile: focus không trở về menu toggle.`);
      }
    }
  } else {
    const focusedNames = [];
    for (let index = 0; index < 18; index += 1) {
      await page.keyboard.press("Tab");
      focusedNames.push(await page.evaluate(() => {
        const element = document.activeElement;
        return `${element?.getAttribute("aria-label") ?? ""} ${element?.textContent ?? ""}`.trim();
      }));
    }
    if (focusedNames.some((value) => LANGUAGE_CONTROL_PATTERN.test(value))) {
      errors.push(`${runtimeLabel} ${route} desktop: tab order còn language control.`);
    }
  }

  await context.close();
  return { ...initial, runtimeErrors };
}

if (stableFileHash(protectedFiles()) !== EXPECTED_PROTECTED_HASH) {
  errors.push("Hash protection: content/schema/social-image/sitemap files drift ngoài task 18.");
}
const quoteManifest = quoteAppManifest();
if (JSON.stringify(quoteManifest) !== JSON.stringify(EXPECTED_QUOTE_APP)) {
  errors.push(`quote-app drift: expected ${JSON.stringify(EXPECTED_QUOTE_APP)}, nhận ${JSON.stringify(quoteManifest)}.`);
}
if (existsSync("quote-app/public/.DS_Store") || existsSync("quote-app/src/.DS_Store")) {
  errors.push("quote-app: hai file .DS_Store không được restore.");
}
if (existsSync(path.join(outputDirectory, "en")) || existsSync(path.join(outputDirectory, "en.html"))) {
  errors.push("Static export còn public /en/ route.");
}
for (const sourceFile of walkFiles("app").concat(walkFiles("components"), walkFiles("lib"))) {
  if (!/\.(?:ts|tsx|js|jsx|mjs)$/u.test(sourceFile)) continue;
  const source = readFileSync(sourceFile, "utf8");
  if (/tungphat-lang|LanguageProvider|useLang\b|setLang\b/gu.test(source)) {
    errors.push(`${sourceFile}: còn language state/persistence cũ.`);
  }
}

const rows = publicHtmlFiles().map((file) => pageAudit(readFileSync(file, "utf8"), routeForFile(file)));

if (runtimeOrigin) {
  for (const row of rows) {
    const response = await directRequest(row.route);
    if (response.status !== 200 || response.location) {
      errors.push(`${runtimeLabel} ${row.route}: phải trả 200 trực tiếp, nhận ${response.status}, Location=${response.location ?? "-"}.`);
      continue;
    }
    pageAudit(response.body, `${runtimeLabel} ${row.route}`);
  }
  const enResponse = await fetch(new URL("/en/", runtimeOrigin), { redirect: "manual" });
  if (enResponse.status === 200) errors.push(`${runtimeLabel}: /en/ không được là public route 200.`);
}

const browserRows = [];
if (runtimeOrigin && browserMode) {
  const browser = await chromium.launch({ headless: true });
  for (const route of REPRESENTATIVE_ROUTES.filter((candidate) => rows.some((row) => row.route === candidate))) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const clean = await browserSnapshot(browser, route, viewport, false);
      const stale = await browserSnapshot(browser, route, viewport, true);
      const label = `${runtimeLabel} ${route} ${viewport.width}x${viewport.height}`;
      if (clean.htmlLang !== "vi" || stale.htmlLang !== "vi") errors.push(`${label}: html lang không cố định vi.`);
      if (clean.ogLocale !== "vi_VN" || stale.ogLocale !== "vi_VN") errors.push(`${label}: og:locale không cố định vi_VN.`);
      if (clean.languageControls || stale.languageControls) errors.push(`${label}: còn visible/accessibility language control.`);
      if (clean.storageMutations.length || stale.storageMutations.length) errors.push(`${label}: phát sinh language storage mutation.`);
      if (clean.languageCookies.length || stale.languageCookies.length) errors.push(`${label}: phát sinh language cookie.`);
      for (const field of ["url", "title", "h1", "mainText", "headerText", "canonical"]) {
        if (clean[field] !== stale[field]) errors.push(`${label}: stale EN làm đổi ${field}.`);
      }
      if (clean.overflow > 1 || stale.overflow > 1) errors.push(`${label}: mobile/desktop overflow ${Math.max(clean.overflow, stale.overflow)}px.`);
      if (clean.runtimeErrors.length || stale.runtimeErrors.length) {
        errors.push(`${label}: console/runtime errors: ${[...clean.runtimeErrors, ...stale.runtimeErrors].join(" | ")}`);
      }
      browserRows.push({ route, viewport, clean, stale });
    }
  }
  await browser.close();
}

const result = {
  label: runtimeLabel,
  routes: rows.length,
  htmlLangMismatches: rows.filter((row) => row.htmlLang !== "vi").length,
  languageControls: rows.reduce((total, row) => total + row.languageControls, 0),
  alternates: rows.reduce((total, row) => total + row.alternates, 0),
  browserChecks: browserRows.length,
  quoteApp: quoteManifest,
  errors,
};

if (jsonOutput) console.log(JSON.stringify(result, null, 2));
else if (errors.length) {
  console.error(`Language consistency validation failed (${runtimeLabel}):`);
  for (const error of errors) console.error(`- ${error}`);
} else {
  console.log(
    `Language consistency validation pass (${runtimeLabel}): ${rows.length} public routes, html lang=vi, og:locale=vi_VN, 0 EN controls/routes/hreflang/query links, ${browserRows.length} browser checks.`,
  );
}

if (errors.length) process.exit(1);
