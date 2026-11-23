export function analyticsAllowedForBuild(buildTarget = process.env.STATIC_BUILD_TARGET) {
  return buildTarget !== "preview";
}

export function shouldLoadGa4({
  pathname,
  measurementId,
  buildTarget = process.env.STATIC_BUILD_TARGET,
}: {
  pathname?: string | null;
  measurementId?: string;
  buildTarget?: string;
}) {
  return analyticsAllowedForBuild(buildTarget)
    && !pathname?.startsWith("/cms-preview")
    && Boolean(measurementId && /^G-[A-Z0-9]{6,}$/iu.test(measurementId));
}
