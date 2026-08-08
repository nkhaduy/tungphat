import rawDataset from "@/data/materials/materials.json";

export type Material = (typeof rawDataset.materials)[number];
export type MaterialSource = (typeof rawDataset.sources)[number];

export type MaterialDataset = {
  schemaVersion: string;
  lastVerified: string;
  description: string;
  materials: Material[];
  sources: MaterialSource[];
};

export type MaterialSelectorInput = {
  application: "cabinetry" | "tabletop" | "shelving" | "panel-detail";
  moistureExposure: "dry" | "humid" | "direct-water";
  finishPreference: "natural-wood" | "decorative-surface" | "any";
  cncRequired: boolean;
};

export type MaterialRecommendation = Material & { score: number; reasons: string[]; caveats: string[] };

const dataset = rawDataset as MaterialDataset;

export function getMaterialDataset(): MaterialDataset {
  return dataset;
}

export function recommendMaterials(input: MaterialSelectorInput): MaterialRecommendation[] {
  return dataset.materials
    .map((material) => {
      let score = 0;
      const reasons: string[] = [];
      if (input.moistureExposure === "humid" && material.moistureProfile === "humid-conditional") {
        score += 5;
        reasons.push("Có thể cân nhắc cho khu vực ẩm hơn phòng khô sau khi xác nhận mã hàng và cạnh.");
      }
      if (input.moistureExposure === "direct-water") {
        score -= material.moistureProfile === "humid-conditional" ? 3 : 1;
      }
      if (input.finishPreference === "natural-wood" && material.finishProfile === "natural-wood-confirmation") {
        score += material.slug === "go-ghep" ? 2 : 5;
        reasons.push("Nhóm vật liệu có bề mặt gỗ tự nhiên cần đối chiếu theo mẫu/lô hàng.");
      }
      if (input.finishPreference === "decorative-surface" && material.finishProfile !== "natural-wood-confirmation") {
        score += 2;
        reasons.push("Có thể kiểm tra theo cốt ván và bề mặt/lớp phủ được xác nhận.");
      }
      if (input.application === "tabletop" && material.slug.startsWith("go-ghep")) score += 2;
      if (input.application === "cabinetry" && ["van-mdf", "mdf-chong-am"].includes(material.slug)) score += 1;
      if (input.application === "shelving" && ["van-mdf", "mdf-chong-am", "go-ghep"].includes(material.slug)) score += 1;
      if (input.cncRequired && material.cncSuitability === "conditional") {
        score += 1;
        reasons.push("Có thể gửi file hoặc danh sách chi tiết để kiểm tra khả năng CNC.");
      }
      const caveats = [...material.limitations];
      if (input.moistureExposure === "direct-water") caveats.unshift("Không chọn tự động cho tiếp xúc nước trực tiếp; cần xác nhận hệ vật liệu riêng.");
      return { ...material, score, reasons, caveats };
    })
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}
