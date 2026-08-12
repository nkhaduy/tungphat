import type { SupplierDefinition, SupplierId } from "./types";

export const supplierDefinitions: SupplierDefinition[] = [
  {
    id: "thanh-thuy",
    displayName: "Thanh Thuỳ",
    brandName: "Thanh Thuỳ",
    logoSrc: "/partners/thanh-thuy-logo.png",
    recordKind: "color-code",
    brandPath: "/thuong-hieu/thanh-thuy/",
    cataloguePath: "/catalogue/thanh-thuy/",
  },
  {
    id: "ba-thanh",
    displayName: "Ba Thanh",
    brandName: "Ba Thanh",
    logoSrc: "/partners/ba-thanh-logo.png",
    recordKind: "color-code",
    brandPath: "/thuong-hieu/ba-thanh/",
    cataloguePath: "/catalogue/ba-thanh/",
  },
  {
    id: "an-cuong",
    displayName: "An Cường",
    brandName: "An Cường",
    logoSrc: "/partners/an-cuong-logo.png",
    recordKind: "color-code",
    brandPath: "/san-pham/an-cuong/",
    cataloguePath: "/catalogue/an-cuong/",
  },
];

const supplierPriorityById = new Map(
  supplierDefinitions.map((supplier, index) => [supplier.id, index]),
);

export function supplierPriority(id: SupplierId): number {
  return supplierPriorityById.get(id) ?? supplierDefinitions.length;
}

export function createSupplierRegistry(definitions: SupplierDefinition[]) {
  const suppliers = new Map<SupplierId, SupplierDefinition>();
  for (const definition of definitions) {
    if (suppliers.has(definition.id)) {
      throw new Error(`Duplicate supplier ID: ${definition.id}`);
    }
    suppliers.set(definition.id, definition);
  }

  return {
    all: () => [...suppliers.values()],
    get: (id: SupplierId) => suppliers.get(id),
  };
}

export const supplierRegistry = createSupplierRegistry(supplierDefinitions);
