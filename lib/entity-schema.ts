import business from "@/content/settings/business.json";
import { absoluteMediaUrl } from "@/lib/media";
import { PHONE_E164, SITE_URL, absolutePageUrl, schemaPageId } from "@/lib/seo";

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

type LocalBusinessLocation = {
  id: string;
  name?: string;
  address: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
  image: string;
  directionsUrl: string;
};

export function buildLocalBusinessSchema(location: LocalBusinessLocation, pagePath: string) {
  const mapIdentity = buildVerifiedMapIdentity(location.directionsUrl);
  return {
    "@context": "https://schema.org",
    "@type": business.localBusinessType,
    "@id": schemaPageId(pagePath, "local-business"),
    name: location.name || business.businessName,
    url: absolutePageUrl(pagePath),
    image: absoluteMediaUrl(location.image, SITE_URL),
    telephone: PHONE_E164,
    email: business.email,
    parentOrganization: { "@id": schemaPageId("/", "organization") },
    areaServed: business.serviceAreas,
    hasMap: location.directionsUrl,
    sameAs: mapIdentity.sameAs,
    ...(mapIdentity.identifier ? { identifier: mapIdentity.identifier } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: location.streetAddress,
      addressLocality: location.addressLocality,
      addressRegion: location.addressRegion,
      addressCountry: location.addressCountry,
    },
  };
}
