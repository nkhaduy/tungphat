export type JsBundleMeasurement = {
  parsedBytes: number;
};

export type JsBundleMeasurements = {
  shared: JsBundleMeasurement;
  homepage: JsBundleMeasurement;
  referenceCenter: JsBundleMeasurement;
  catalogue: JsBundleMeasurement;
};

type BuildManifest = {
  rootMainFiles: string[];
  pages: Record<string, string[]>;
};

export const DEFAULT_JS_BUDGETS = {
  sharedParsedBytes: 390_000,
  homepageParsedBytes: 455_000,
  referenceCenterParsedBytes: 485_000,
  catalogueParsedBytes: 470_000,
} as const;

function measureFiles(files: string[], sizeOf: (file: string) => number) {
  return {
    parsedBytes: [...new Set(files)]
      .filter((file) => file.endsWith(".js"))
      .reduce((total, file) => total + sizeOf(file), 0),
  };
}

function requireJavaScriptFiles(files: string[] | undefined, label: string) {
  const javascriptFiles = files?.filter((file) => file.endsWith(".js")) ?? [];
  if (!javascriptFiles.length) throw new Error(label);
  return javascriptFiles;
}

export function measureRouteBundles(
  manifest: BuildManifest,
  sizeOf: (file: string) => number,
): JsBundleMeasurements {
  const sharedFiles = requireJavaScriptFiles(
    manifest.rootMainFiles,
    "Missing shared JavaScript bundle entry",
  );
  const routeFiles = (route: string) =>
    requireJavaScriptFiles(
      manifest.pages[route],
      `Missing required route bundle entry: ${route}`,
    );

  return {
    shared: measureFiles(sharedFiles, sizeOf),
    homepage: measureFiles(routeFiles("/page"), sizeOf),
    referenceCenter: measureFiles(routeFiles("/tham-chieu-vat-lieu/page"), sizeOf),
    catalogue: measureFiles(routeFiles("/catalogue/page"), sizeOf),
  };
}

export function validateJsBudgets(
  measured: JsBundleMeasurements,
  budgets = DEFAULT_JS_BUDGETS,
) {
  const checks = [
    ["shared", measured.shared.parsedBytes, budgets.sharedParsedBytes],
    ["homepage", measured.homepage.parsedBytes, budgets.homepageParsedBytes],
    [
      "referenceCenter",
      measured.referenceCenter.parsedBytes,
      budgets.referenceCenterParsedBytes,
    ],
    ["catalogue", measured.catalogue.parsedBytes, budgets.catalogueParsedBytes],
  ] as const;

  return checks
    .filter(([, actual, budget]) => actual > budget)
    .map(
      ([name, actual, budget]) =>
        `${name} JavaScript is ${actual} parsed bytes; budget is ${budget}`,
    );
}
