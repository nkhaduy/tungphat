export function secureRandomIndex(length: number) {
  if (!Number.isInteger(length) || length <= 0) return 0;

  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}
