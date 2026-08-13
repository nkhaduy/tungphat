export type BaThanhLaminateWayDefinition = {
  routeCode: string;
  catalogueCode: string;
  matchingMelamineCode: string;
  category: "van-go" | "don-sac" | "van-da" | "van-vai";
  sourceCategoryLabel: "MÀU VÂN GỖ" | "MÀU ĐƠN SẮC" | "MÀU VÂN ĐÁ" | "MÀU VÂN VẢI";
};

const legacyGroups = {
  "van-go": [
    ["W7020", "W 7020 Z", "BT 166"], ["W7393", "W 7393 Z", "BT 167"],
    ["W0502", "W 0502 Z", "BT 163"], ["W0304", "W 0304 Z", "BT 162"],
    ["W0504", "W 0504 Z", "BT 161"], ["W9630", "W 9630 Z", "BT 160"],
    ["W7412", "W 7412 Z", "BT 159"], ["W5220", "W 5220 N", "BT 158"],
  ],
  "don-sac": [
    ["P2052", "P 2052 G", "SC 017 MW"], ["P2061", "P 2061 G", "SC 018 MW"],
    ["P1150", "P 1150 G", "SC 015 MW"], ["P2002", "P 2002 G", "SC 016 MW"],
    ["P1010", "P 1010 G", "SC 013 MW"], ["P2001", "P 2001 G", "SC 014 MW"],
    ["P9120", "P 9120 CY", "SC 011 MW"], ["P3190", "P 3190 CY", "SC 012 MW"],
    ["P7700", "P 7700 CY", "SC 009 MW"], ["P7740", "P 7740 R", "SC 010 MW"],
    ["P7790", "P 7790 R", "SC 017 M"], ["P9340", "P 9340 R", "SC 018 M"],
    ["P4600", "P 4600 R", "SC 015 M"], ["P4640", "P 4640 R", "SC 016 M"],
    ["P2660", "P 2660 G", "SC 013 M"], ["P9660", "P 9660 G", "SC 014 M"],
  ],
  "van-da": [
    ["S7403", "S 7403 G", "BT 165"], ["S7402", "S 7402 G", "BT 164"],
    ["S7382", "S 7382 G", "BT S8"], ["S4600", "S 4600 G", "BT S9"],
  ],
  "van-vai": [
    ["F0022", "F 0022 X", "BT 117"], ["F3292", "F 3292 X", "BT 118"],
    ["F3293", "F 3293 X", "BT 52"], ["F3294", "F 3294 X", "BT 146"],
    ["F3295", "F 3295 X", "BT 90"],
  ],
} as const;

const sourceCategoryLabels = {
  "van-go": "MÀU VÂN GỖ",
  "don-sac": "MÀU ĐƠN SẮC",
  "van-da": "MÀU VÂN ĐÁ",
  "van-vai": "MÀU VÂN VẢI",
} as const;

export const BA_THANH_LAMINATE_WAY_LEGACY_DEFINITIONS: BaThanhLaminateWayDefinition[] =
  Object.entries(legacyGroups).flatMap(([category, records]) => records.map(([routeCode, catalogueCode, matchingMelamineCode]) => ({
    routeCode,
    catalogueCode,
    matchingMelamineCode,
    category: category as keyof typeof sourceCategoryLabels,
    sourceCategoryLabel: sourceCategoryLabels[category as keyof typeof sourceCategoryLabels],
  })));

const lwNewEntries: Array<[string, string, BaThanhLaminateWayDefinition["category"]]> = [
  ["LW A150 T", "BT A150 T", "don-sac"], ["LW A150 M", "BT A150 M", "don-sac"], ["LW A150 G", "BT A150 G", "don-sac"],
  ["LW XÁM CHÌ T", "BT XÁM CHÌ T", "don-sac"], ["LW ĐEN T", "BT ĐEN T", "don-sac"], ["LW ĐEN M", "BT ĐEN M", "don-sac"],
  ["LW ĐEN G", "BT ĐEN G", "don-sac"], ["LW XÁM T", "BT XÁM T", "don-sac"], ["LW 01 T", "BT 01 T", "don-sac"],
  ["LW 01 M", "BT 01 M", "don-sac"], ["LW 01 G", "BT 01 G", "don-sac"], ["LW 60 T", "BT 60", "van-da"],
  ["LW S6 G", "BT S6 G", "van-da"], ["LW S9 G", "BT S9 G", "van-da"], ["LW 52", "BT 52", "van-vai"],
  ["LW SC001 M", "SC 001 M", "don-sac"], ["LW SC002 M", "SC 002 M", "don-sac"], ["LW SC003 M", "SC 003 M", "don-sac"],
  ["LW SC004 M", "SC 004 M", "don-sac"], ["LW SC005 M", "SC 005 M", "don-sac"], ["LW SC008 M", "SC 008 M", "don-sac"],
  ["LW SC011 M", "SC 011 M", "don-sac"], ["LW SC014 M", "SC 014 M", "don-sac"], ["LW SC015 M", "SC 015 M", "don-sac"],
  ["LW SC016 M", "SC 016 M", "don-sac"], ["LW SC017 M", "SC 017 M", "don-sac"], ["LW SC018 M", "SC 018 M", "don-sac"],
  ...[20, 28, 34, 37, 48, 56, 58, 59, 61, 54, 62, 63, 64, 70, 74, 75, 76, 78, 79, 80, 81, 82, 85, 86, 87, 88, 93, 98, 100, 112, 113, 122, 125, 130, 131, 137, 140, 141, 143, 123, 151, 152, 155, 157, 161, 158, 160, 167, 168, 162, 163, 142, 171]
    .map((code): [string, string, "van-go"] => [`LW ${code} T`, `BT ${code}`, "van-go"]),
];

function compactCode(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export const BA_THANH_LAMINATE_WAY_NEW_DEFINITIONS: BaThanhLaminateWayDefinition[] = lwNewEntries.map(
  ([catalogueCode, matchingMelamineCode, category]) => ({
    routeCode: compactCode(catalogueCode),
    catalogueCode,
    matchingMelamineCode,
    category,
    sourceCategoryLabel: sourceCategoryLabels[category],
  }),
);

export const BA_THANH_LAMINATE_WAY_DEFINITIONS = [
  ...BA_THANH_LAMINATE_WAY_LEGACY_DEFINITIONS,
  ...BA_THANH_LAMINATE_WAY_NEW_DEFINITIONS,
];

export const BA_THANH_LAMINATE_WAY_BY_ROUTE = new Map(
  BA_THANH_LAMINATE_WAY_DEFINITIONS.map((definition) => [definition.routeCode, definition]),
);
