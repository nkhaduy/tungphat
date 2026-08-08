import { isIP } from "node:net";

export function createIpLookupOverride(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  const family = isIP(candidate);
  if (!family) return undefined;

  return (_hostname, options, callback) => {
    if (options?.all) callback(null, [{ address: candidate, family }]);
    else callback(null, candidate, family);
  };
}
