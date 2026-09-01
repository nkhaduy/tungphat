const textExtensions = /\.(?:css|html|js|json|txt|webmanifest|xml)$/i;

export function findReferencedExportAssetPaths(files, candidatePaths, readText) {
  const pending = new Set(candidatePaths);
  const referenced = new Set();

  for (const file of files) {
    if (!textExtensions.test(file) || pending.size === 0) continue;
    const text = readText(file);
    for (const candidate of pending) {
      if (!text.includes(candidate)) continue;
      pending.delete(candidate);
      referenced.add(candidate);
    }
  }

  return referenced;
}
