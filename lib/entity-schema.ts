export function buildVerifiedMapIdentity(directionsUrl: string) {
  let placeId: string | null = null;
  try {
    const query = new URL(directionsUrl).searchParams.get("q") ?? "";
    if (query.startsWith("place_id:")) placeId = query.slice("place_id:".length) || null;
  } catch {
    placeId = null;
  }

  return {
    sameAs: [directionsUrl],
    identifier: placeId
      ? { "@type": "PropertyValue", propertyID: "Google Place ID", value: placeId }
      : null,
  } as const;
}
