import { supplierDefinitions } from "./registry";
import type { SupplierId } from "./types";

export type SupplierNavigationLink = {
  supplierId: SupplierId;
  label: string;
  href: string;
};

export const supplierNavigation: {
  catalogue: SupplierNavigationLink[];
  brands: SupplierNavigationLink[];
} = {
  catalogue: supplierDefinitions.map((supplier) => ({
    supplierId: supplier.id,
    label: `Catalogue ${supplier.displayName}`,
    href: supplier.cataloguePath,
  })),
  brands: supplierDefinitions.map((supplier) => ({
    supplierId: supplier.id,
    label: supplier.displayName,
    href: supplier.brandPath,
  })),
};
