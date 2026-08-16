import artifact from "@/data/catalogs/supplier-color-codes.json";
import type { PublicSupplierColorCode, SupplierColorCodeSupplier } from "./types";

const records = (artifact.records as PublicSupplierColorCode[]);

export function getPublicColorCodes(): PublicSupplierColorCode[] {
  return records;
}

export function getPublicColorCode(supplier: string, material: string, slug: string) {
  return records.find(
    (record) =>
      record.supplier === supplier &&
      record.materialType === material &&
      record.slug === slug,
  );
}

export function getPublicColorCodesForSupplier(supplier: SupplierColorCodeSupplier) {
  return records.filter((record) => record.supplier === supplier);
}

export function getPublicColorCodesForMaterial(supplier: SupplierColorCodeSupplier, material: string) {
  return records.filter(
    (record) => record.supplier === supplier && record.materialType === material,
  );
}

export function getPublicColorCodeMaterials(supplier: SupplierColorCodeSupplier) {
  return [...new Set(getPublicColorCodesForSupplier(supplier).map((record) => record.materialType))];
}
