import type {
  AnCuongProductRelation,
  CategoryRecord,
  DimensionThickness,
  RawProductDetail,
  SourceDescription,
  ListingProduct
} from "./types";

type ParsedRelations = {
  relatedProducts: AnCuongProductRelation[];
  sameColorProducts: AnCuongProductRelation[];
  applicationProducts: AnCuongProductRelation[];
};

type ProductDetailInput = {
  sourceUrl: string;
  sourceHash: string;
  discoveredAt: string;
  fetchedAt: string;
};

export type ParsedProductDetail = RawProductDetail & { sourceContent: SourceDescription[] };

function decodeHtml(value: string): string {
  return value
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(Number(code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : code)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">" );
}

function text(value: string): string {
  return decodeHtml(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attrs(openTag: string): Record<string, string> {
  const output: Record<string, string> = {};
  for (const match of openTag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) output[match[1]!.toLowerCase()] = decodeHtml(match[2]!);
  return output;
}

function openTag(element: string, tag: string): string {
  return element.match(new RegExp(`<${tag}\\b[^>]*>`, "i"))?.[0] ?? "";
}

function elements(html: string, tag: string, predicate?: (opening: string) => boolean): string[] {
  if (["img", "source", "meta", "link", "input"].includes(tag.toLowerCase())) {
    const token = new RegExp(`<${tag}\\b[^>]*>`, "gi");
    return [...html.matchAll(token)]
      .map((match) => match[0])
      .filter((opening) => !predicate || predicate(opening));
  }
  const result: Array<{ start: number; end: number; matched: boolean }> = [];
  const token = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, "gi");
  const stack: Array<{ start: number; matched: boolean }> = [];
  let match: RegExpExecArray | null;
  while ((match = token.exec(html))) {
    if (match[0][1] !== "/") {
      stack.push({ start: match.index, matched: !predicate || predicate(match[0]) });
    } else {
      const opening = stack.pop();
      if (opening?.matched) result.push({ start: opening.start, end: token.lastIndex, matched: true });
    }
  }
  return result.sort((a, b) => a.start - b.start).map(({ start, end }) => html.slice(start, end));
}

function first(html: string, tag: string, predicate?: (opening: string) => boolean): string {
  return elements(html, tag, predicate)[0] ?? "";
}

function firstText(html: string, tag: string, predicate?: (opening: string) => boolean): string {
  return text(first(html, tag, predicate));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function slug(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function absoluteSourceId(url: string): string | undefined {
  return url.match(/\/(\d+)\.html(?:$|[?#])/i)?.[1];
}

function canonicalUrl(url: string): string {
  const value = new URL(url, "https://ancuong.com/");
  value.hash = "";
  value.search = "";
  return value.toString();
}

function normalizeDimension(value: string): string {
  return value.trim().replace(/[×*]/g, "x").replace(/\s*x\s*/gi, "x").replace(/\s+/g, "");
}

function optionMap(html: string): Map<string, { facet: string; value: string }> {
  const map = new Map<string, { facet: string; value: string }>();
  for (const box of elements(html, "div", (opening) => /class=["'][^"']*box-filter-search/i.test(opening))) {
    const facet = firstText(box, "span", (opening) => /class=["'][^"']*dropdown-title/i.test(opening)) || firstText(box, "div", (opening) => /class=["'][^"']*dropdown-title/i.test(opening));
    if (!facet) continue;
    for (const label of elements(box, "label", (opening) => /data-filter=/i.test(opening))) {
      const labelAttrs = attrs(openTag(label, "label"));
      const option = labelAttrs["data-filter"]?.replace(/^\./, "");
      const value = labelAttrs["data-name"] || text(label);
      if (option && value) map.set(option, { facet, value });
    }
  }
  return map;
}

function categoryFromUrl(sourceUrl: string, html: string): { name: string; slug: string } {
  const pathname = new URL(sourceUrl).pathname;
  const isDetail = /\/\d+\.html$/i.test(pathname);
  const pathSegments = pathname.split("/").filter(Boolean);
  const sourceSlug = (isDetail ? pathSegments.at(-2) : pathSegments.at(-1))?.replace(/\.html$/i, "");
  const breadcrumbBlock = first(html, "div", (opening) => /class=["'][^"']*breadcrumb/i.test(opening));
  const breadcrumb = elements(breadcrumbBlock, "a", (opening) => /href=/i.test(opening))
    .map((item) => ({ label: text(item), href: attrs(openTag(item, "a")).href ?? "" }))
    .filter((item) => item.label && /\.html(?:$|[?#])/i.test(item.href));
  const productPage = first(html, "main", (opening) => /id=["']product-page["']/i.test(opening));
  const listingTitle = firstText(productPage, "div", (opening) => /class=["'][^"']*title-h1/i.test(opening));
  const name = (isDetail ? breadcrumb[0]?.label : listingTitle) || breadcrumb[0]?.label || firstText(productPage, "h1") || new URL(sourceUrl).pathname.split("/").pop()?.replace(/\.html$/, "") || "Catalogue";
  return { name, slug: slug(sourceSlug || name) };
}

export function parseCatalogueCategories(html: string): CategoryRecord[] {
  const categories = new Map<string, CategoryRecord>();
  for (const anchor of elements(html, "a", (opening) => /data-name=["']products-[^"']+["']/i.test(opening))) {
    const opening = openTag(anchor, "a");
    const attributes = attrs(opening);
    const sourceUrl = attributes.href;
    if (!sourceUrl || /(?:tin-tuc|kien-thuc|du-an|tuyen-dung|lien-he|search)/i.test(sourceUrl)) continue;
    const name = text(anchor);
    const categorySlug = slug(attributes["data-name"]?.replace(/^products-/, "") || name);
    if (!categorySlug || !name) continue;
    categories.set(canonicalUrl(sourceUrl), { name, slug: categorySlug, sourceUrl: canonicalUrl(sourceUrl), catalogueUrls: [] });
  }
  for (const book of elements(html, "div", (opening) => /class=["'][^"']*bookshelf-link/i.test(opening))) {
    const title = firstText(book, "h3");
    const link = elements(book, "a")[0];
    const href = link ? attrs(openTag(link, "a")).href : undefined;
    if (!href) continue;
    const target = [...categories.values()].find((category) => title.toLocaleLowerCase().includes(category.name.toLocaleLowerCase()));
    if (target && !target.catalogueUrls.includes(href)) target.catalogueUrls.push(href);
  }
  return [...categories.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function parseListingPage(html: string, sourceUrl: string): { facets: Record<string, string[]>; products: ListingProduct[] } {
  const category = categoryFromUrl(sourceUrl, html);
  const options = optionMap(html);
  const facets: Record<string, string[]> = {};
  for (const value of options.values()) facets[value.facet] = unique([...(facets[value.facet] ?? []), value.value]);
  const products: ListingProduct[] = [];
  for (const card of elements(html, "div", (opening) => /class=["'][^"']*product-box/i.test(opening) && /data-(?:size|kind|color|surface|style|material|effect|collection|solution|banding|format)/i.test(opening))) {
    const cardAttrs = attrs(openTag(card, "div"));
    const link = elements(card, "a", (opening) => /href=/i.test(opening)).find((item) => /\/\d+\.html/i.test(attrs(openTag(item, "a")).href ?? ""));
    if (!link) continue;
    const linkAttrs = attrs(openTag(link, "a"));
    const source = canonicalUrl(linkAttrs.href!);
    const sourceId = absoluteSourceId(source);
    if (!sourceId) continue;
    const title = first(card, "div", (opening) => /class=["'][^"']*left-title/i.test(opening));
    const headings = elements(title, "h2").map(text);
    const name = firstText(title, "h3");
    const image = elements(card, "img").map((item) => attrs(openTag(item, "img"))["data-src"] || attrs(openTag(item, "img")).src).find(Boolean);
    const facetKeys: Record<string, string[]> = {};
    for (const [attribute, value] of Object.entries(cardAttrs)) {
      if (!attribute.startsWith("data-") || attribute === "data-highlight") continue;
      for (const option of value.split(/\s+/)) {
        const mapped = options.get(option);
        if (mapped) facetKeys[mapped.facet] = unique([...(facetKeys[mapped.facet] ?? []), mapped.value]);
      }
    }
    products.push({ sourceUrl: source, sourceId, category: category.name, categorySlug: category.slug, productCode: headings[0] ?? "", name, ...(image ? { imageUrl: image } : {}), facetKeys });
  }
  return { facets: Object.fromEntries(Object.entries(facets).sort(([a], [b]) => a.localeCompare(b))), products };
}

export function parseDimensionThicknessTable(html: string): DimensionThickness[] {
  const table = elements(html, "table").find((item) => /t-head-top|Độ Dày/i.test(item));
  if (!table) return [];
  const rows = elements(table, "tr");
  const header = rows.find((row) => elements(row, "td").some((cell) => /t-num/i.test(openTag(cell, "td"))));
  if (!header) return [];
  const thicknesses = elements(header, "td").filter((cell) => /t-num/i.test(openTag(cell, "td"))).map(text);
  const result: DimensionThickness[] = [];
  for (const row of rows) {
    const cells = elements(row, "td");
    const dimensionCell = cells.find((cell) => /t-left/i.test(openTag(cell, "td")));
    if (!dimensionCell) continue;
    const dimension = normalizeDimension(text(dimensionCell));
    const available = cells.slice(cells.indexOf(dimensionCell) + 1).map(text);
    result.push({ dimension, thicknesses: thicknesses.filter((_, index) => /^o$/i.test(available[index] ?? "")) });
  }
  return result;
}

function relationFromCard(card: string, relationType: AnCuongProductRelation["relationType"]): AnCuongProductRelation | undefined {
  const link = elements(card, "a", (opening) => /href=/i.test(opening)).find((item) => /\/\d+\.html/i.test(attrs(openTag(item, "a")).href ?? ""));
  if (!link) return undefined;
  const sourceUrl = canonicalUrl(attrs(openTag(link, "a")).href!);
  const sourceId = absoluteSourceId(sourceUrl);
  const title = first(card, "div", (opening) => /class=["'][^"']*left-title/i.test(opening));
  const h2 = firstText(title, "h2");
  const name = firstText(title, "h3");
  return { relationType, sourceUrl, ...(sourceId ? { sourceId } : {}), ...(h2 ? { productCode: h2 } : {}), ...(name ? { name } : {}) };
}

export function parseExplicitRelations(html: string): ParsedRelations {
  const sameColorProducts: AnCuongProductRelation[] = [];
  const relatedProducts: AnCuongProductRelation[] = [];
  const applicationProducts: AnCuongProductRelation[] = [];
  const mapTab = first(html, "div", (opening) => /data-name=["']product-map["']/i.test(opening));
  for (const card of elements(mapTab, "div", (opening) => /class=["'][^"']*product-box/i.test(opening))) {
    const relation = relationFromCard(card, "same-color");
    if (relation) sameColorProducts.push(relation);
  }
  const lineTab = first(html, "div", (opening) => /data-name=["']product-line["']/i.test(opening));
  for (const card of elements(lineTab, "div", (opening) => /class=["'][^"']*children-length/i.test(opening))) {
    const info = first(card, "div", (opening) => /class=["'][^"']*product-cate-info/i.test(opening));
    const link = elements(info, "a", (opening) => /href=/i.test(opening))[0];
    const href = link ? attrs(openTag(link, "a")).href : undefined;
    const name = firstText(info, "h3");
    if (href && name) relatedProducts.push({ relationType: "same-line", sourceUrl: canonicalUrl(href), name });
  }
  const album = first(html, "div", (opening) => /class=["'][^"']*product-title-album/i.test(opening));
  const albumLink = elements(album, "a", (opening) => /class=["'][^"']*view-album/i.test(opening))[0];
  if (albumLink) {
    const sourceUrl = canonicalUrl(attrs(openTag(albumLink, "a")).href!);
    const sourceId = sourceUrl.match(/\/album-product\/(\d+)/i)?.[1];
    applicationProducts.push({ relationType: "application", sourceUrl, ...(sourceId ? { sourceId } : {}), name: firstText(album, "span") || "Sản Phẩm Ứng Dụng" });
  }
  return { relatedProducts: uniqueRelations(relatedProducts), sameColorProducts: uniqueRelations(sameColorProducts), applicationProducts: uniqueRelations(applicationProducts) };
}

function uniqueRelations(relations: AnCuongProductRelation[]): AnCuongProductRelation[] {
  const seen = new Set<string>();
  return relations.filter((relation) => {
    const key = `${relation.relationType}:${relation.sourceId ?? relation.sourceUrl ?? relation.productCode ?? relation.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function classifySourceText(value: string): SourceDescription {
  const clean = text(value);
  const technical = /(?:\d+\s*[x×*]\s*\d+|\d+\s*mm\b|kích thước|độ dày|tiêu chuẩn|mã sản phẩm|nhóm giá)/i.test(clean);
  return { value: clean, classification: technical ? "TECHNICAL_DATA" : "SOURCE_MARKETING_COPY", contentUsageStatus: technical ? "technical-data" : "requires-rewrite" };
}

export function parseProductDetail(html: string, input: ProductDetailInput): ParsedProductDetail {
  const category = categoryFromUrl(input.sourceUrl, html);
  const sourceId = absoluteSourceId(input.sourceUrl) ?? "";
  const titleInfo = first(html, "div", (opening) => /class=["'][^"']*title-info/i.test(opening));
  const name = firstText(titleInfo, "h1") || firstText(html, "h1");
  const productCode = text(titleInfo.match(/Mã\s*Sản\s*Phẩm[\s\S]{0,120}?<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? "");
  const facets: Record<string, string[]> = {};
  const info = first(html, "div", (opening) => /class=["'][^"']*product-info/i.test(opening));
  for (const item of elements(info, "div", (opening) => /class=["'][^"']*des-item/i.test(opening))) {
    const key = firstText(item, "span").replace(/:$/, "");
    const value = firstText(item, "h3");
    if (key && value) facets[key] = unique([...(facets[key] ?? []), value]);
  }
  const details = first(html, "section", (opening) => /class=["'][^"']*product-details/i.test(opening));
  const primary = elements(details, "div", (opening) => /class=["'][^"']*details-pic/i.test(opening))[0];
  const primaryImageUrl = primary ? attrs(openTag(primary, "div"))["data-full"] : undefined;
  const galleryUrls = unique([
    primaryImageUrl ?? "",
    ...elements(details, "img")
      .map((item) => {
        const imageAttrs = attrs(openTag(item, "img"));
        return imageAttrs["data-src"] || imageAttrs.src || "";
      })
      .filter((url) => !(primaryImageUrl && /products-thumb\//i.test(url)))
  ]);
  const relations = parseExplicitRelations(html);
  const productLines: ParsedProductDetail["productLines"] = [];
  const sourceContent: SourceDescription[] = [];
  const lineTab = first(html, "div", (opening) => /data-name=["']product-line["']/i.test(opening));
  for (const line of elements(lineTab, "div", (opening) => /class=["'][^"']*children-length/i.test(opening))) {
    const infoBlock = first(line, "div", (opening) => /class=["'][^"']*product-cate-info/i.test(opening));
    const lineTitle = firstText(infoBlock, "h3");
    const description = firstText(infoBlock, "div", (opening) => /class=["'][^"']*box-content/i.test(opening));
    const groups = elements(infoBlock, "div", (opening) => /class=["'][^"']*list-features/i.test(opening));
    const features = unique(
      groups
        .filter((group) => /<h3[^>]*>\s*Tính năng\s*<\/h3>/i.test(group))
        .flatMap((group) =>
          elements(group, "div", (opening) => /class=["'][^"']*features-item/i.test(opening)).map(
            (item) => attrs(openTag(item, "div"))["data-tip"]
          )
        )
    );
    const standards = unique(
      groups
        .filter((group) => /Tiêu chuẩn/i.test(group))
        .flatMap((group) =>
          elements(group, "div", (opening) => /class=["'][^"']*features-item/i.test(opening)).map(
            (item) => attrs(openTag(item, "div"))["data-tip"]
          )
        )
    );
    const lineUrl = elements(infoBlock, "a", (opening) => /href=/i.test(opening)).map((item) => attrs(openTag(item, "a")).href).find(Boolean);
    const warningTexts = elements(line, "p").map(text).filter((value) => /^\*/.test(value));
    const lineRecord = { name: lineTitle, ...(lineUrl ? { sourceUrl: canonicalUrl(lineUrl) } : {}), ...(description ? { description } : {}), features, standards, dimensionThicknessMatrix: parseDimensionThicknessTable(line), technicalWarnings: warningTexts };
    if (description) sourceContent.push(classifySourceText(description));
    sourceContent.push(...warningTexts.map(classifySourceText));
    productLines.push(lineRecord);
  }
  return { sourceUrl: canonicalUrl(input.sourceUrl), sourceId, category: category.name, categorySlug: category.slug, name, productCode, facets, primaryImageUrl, galleryUrls, ...relations, productLines, sourceContent, sourceHash: input.sourceHash, discoveredAt: input.discoveredAt, fetchedAt: input.fetchedAt };
}
