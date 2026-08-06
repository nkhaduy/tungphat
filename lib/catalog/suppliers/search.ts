import type { CatalogSearchEntry } from "../core/types";
import { anCuongAdapter } from "./an-cuong";
import { baThanhAdapter } from "./ba-thanh";
import { thanhThuyAdapter } from "./thanh-thuy";

export function getSupplierSearchEntries(): CatalogSearchEntry[] {
  return [thanhThuyAdapter, baThanhAdapter, anCuongAdapter].flatMap((adapter) =>
    adapter.getSearchEntries(),
  );
}
