import rawDataset from "@/data/materials/materials.json";
import { validatePublishedProvenance, type SourceQualityTier } from "@/lib/source-quality";

export type Material = {
  id: string;
  recordType: "MATERIAL_FAMILY" | "PRODUCT_CODE";
  slug: string;
  detailUrl: string;
  name: string;
  manufacturer: string | null;
  brand: string | null;
  code: string | null;
  sku: string | null;
  category: string;
  materialFamily: string;
  materialClass: string;
  dimensions: string | string[] | null;
  thicknesses: string | string[] | null;
  finish: string | null;
  surface: string | null;
  substrate: string | null;
  composition: string | null;
  density: string | null;
  moistureBehavior: string | null;
  machining: string | null;
  typicalApplications: string[];
  availabilityStatus: string;
  moistureProfile: string;
  finishProfile: string;
  cncSuitability: string;
  applications: string[];
  limitations: string[];
  sourceIds: string[];
  fieldSourceIds: Record<string, string[]>;
  checkedAt: string;
  confidence: "low" | "medium" | "high";
};

export type MaterialComparisonRecord = {
  id: string;
  name: string;
  composition: string | null;
  density: string | null;
  moistureBehavior: string | null;
  machining: string | null;
  surfaceFinish: string | null;
  typicalApplications: string | null;
  choiceGuidance: string | null;
  sourceIds: string[];
};

export type MaterialSource = {
  id: string;
  sourceType: string;
  qualityTier: SourceQualityTier;
  sourceTitle: string;
  sourceUrl: string;
  sourceFile: string | null;
  retrievedAt: string;
  publisher: string;
  confidence: "low" | "medium" | "high";
};

export type MaterialDataset = {
  schemaVersion: string;
  lastVerified: string;
  description: string;
  materials: Material[];
  comparisonMatrix: MaterialComparisonRecord[];
  sources: MaterialSource[];
};

export type MaterialSelectorInput = {
  application: "cabinetry" | "tabletop" | "shelving" | "panel-detail";
  moistureExposure: "dry" | "humid" | "direct-water";
  finishPreference: "natural-wood" | "decorative-surface" | "any";
  cncRequired: boolean;
};

export type MaterialRecommendation = Material & { score: number; reasons: string[]; caveats: string[] };

const dataset = rawDataset as unknown as MaterialDataset;

export function getMaterialDataset(): MaterialDataset {
  return dataset;
}

export function validateMaterialDatasetProvenance(input: MaterialDataset) {
  const materialFields = input.materials.flatMap((material) => Object.entries(material.fieldSourceIds).map(([field, sourceIds]) => ({
    recordId: material.id,
    field,
    value: material[field as keyof Material],
    sourceIds,
  })));
  const matrixFields = input.comparisonMatrix.flatMap((record) => ["composition", "density", "moistureBehavior", "machining", "surfaceFinish", "typicalApplications", "choiceGuidance"].map((field) => ({
    recordId: record.id,
    field,
    value: record[field as keyof MaterialComparisonRecord],
    sourceIds: record.sourceIds,
  })));
  return validatePublishedProvenance({ sources: input.sources, fields: [...materialFields, ...matrixFields] });
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
