import { expect, it } from "vitest";
import { homeProductCards } from "@/lib/product-taxonomy";
import { supplierDefinitions } from "@/lib/catalog/core/registry";

it("shows the ten main material groups in the required order", () => {
  expect(homeProductCards.map((card) => card.title)).toEqual([
    "Ván MDF – HDF", "MDF chống ẩm (LMR – MMR – HMR)", "Ván Okal – MFC (Ván dăm)", "Ván ép – Plywood", "Gỗ ghép cao su", "Melamine", "Laminate", "Ván phủ Veneer", "Ván nhựa", "Chỉ dán cạnh",
  ]);
  expect(new Set(homeProductCards.map((card) => card.id)).size).toBe(10);
});

it("orders supplier filters consistently", () => {
  expect(supplierDefinitions.map((supplier) => supplier.id)).toEqual(["thanh-thuy", "an-cuong", "ba-thanh"]);
});
