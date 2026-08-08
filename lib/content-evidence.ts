type EvidenceProduct = {
  title: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  dimensions: string[];
  thicknesses: string[];
  surfaces: string[];
  applications: string[];
  limitations: string[];
  canonical: string;
  body: string;
};

export function scoreProductEvidence(product: EvidenceProduct) {
  return [
    product.title.trim().length > 0,
    product.excerpt.trim().length >= 40,
    product.featuredImage.trim().length > 0,
    product.category.trim().length > 0,
    product.dimensions.length + product.thicknesses.length + product.surfaces.length > 0,
    product.applications.length > 0,
    product.limitations.length > 0,
    product.canonical.trim().length > 0,
    product.body.trim().length >= 300,
  ].filter(Boolean).length;
}

export function hasMinimumProductEvidence(product: EvidenceProduct) {
  return scoreProductEvidence(product) >= 7;
}
