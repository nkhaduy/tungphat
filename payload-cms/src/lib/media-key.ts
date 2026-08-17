const allowedPrefixes = new Set(['catalog', 'supplier', 'videos', 'uploads'])

export function safeMediaKey(parts: string[]): string | null {
  const decoded = parts.map((part) => decodeURIComponent(part))
  if (!decoded.length || !allowedPrefixes.has(decoded[0])) return null
  if (decoded.some((part) => !part || part === '.' || part === '..' || part.includes('\\') || part.includes('\0'))) return null
  return decoded.join('/')
}
