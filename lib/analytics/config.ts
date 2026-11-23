function currentBuildTarget() {
  return process.env.NEXT_PUBLIC_STATIC_BUILD_TARGET || process.env.STATIC_BUILD_TARGET;
}

export function analyticsAllowedForBuild(buildTarget = currentBuildTarget()) {
  return buildTarget !== "preview";
}

export function shouldLoadGa4({
  pathname,
  measurementId,
  buildTarget = currentBuildTarget(),
}: {
  pathname?: string | null;
  measurementId?: string;
  buildTarget?: string;
}) {
  return analyticsAllowedForBuild(buildTarget)
    && !pathname?.startsWith("/cms-preview")
    && Boolean(measurementId && /^G-[A-Z0-9]{6,}$/iu.test(measurementId));
}
