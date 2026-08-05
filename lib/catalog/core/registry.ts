import type { SupplierDefinition, SupplierId } from "./types";

export const supplierDefinitions: SupplierDefinition[] = [
  {
    id: "thanh-thuy",
    displayName: "Thanh Thuỳ",
    brandName: "Thanh Thuỳ",
    recordKind: "product",
    brandPath: "/thuong-hieu/thanh-thuy/",
    cataloguePath: "/thuong-hieu/thanh-thuy/",
  },
  {
    id: "ba-thanh",
    displayName: "Ba Thanh",
    brandName: "Ba Thanh",
    recordKind: "color-code",
    brandPath: "/thuong-hieu/ba-thanh/",
    cataloguePath: "/ma-mau-melamine/ba-thanh/",
  },
  {
    id: "an-cuong",
    displayName: "An Cường",
    brandName: "An Cường",
    recordKind: "catalogue-item",
    brandPath: "/san-pham/an-cuong/",
    cataloguePath: "/catalogue/an-cuong/",
  },
];

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

