"use client";

import { useState } from "react";
import { recommendMaterials, type MaterialRecommendation } from "@/lib/materials";

const labels = {
  application: { cabinetry: "Tủ", tabletop: "Mặt bàn", shelving: "Kệ", "panel-detail": "Chi tiết dạng tấm" },
  moistureExposure: { dry: "Phòng khô", humid: "Có độ ẩm", "direct-water": "Có nước trực tiếp" },
  finishPreference: { "natural-wood": "Vân gỗ tự nhiên", "decorative-surface": "Bề mặt phủ/trang trí", any: "Chưa chốt" },
} as const;

export function MaterialSelector() {
  const [result, setResult] = useState<MaterialRecommendation[] | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setResult(recommendMaterials({
      application: form.get("application") as "cabinetry" | "tabletop" | "shelving" | "panel-detail",
      moistureExposure: form.get("moistureExposure") as "dry" | "humid" | "direct-water",
      finishPreference: form.get("finishPreference") as "natural-wood" | "decorative-surface" | "any",
      cncRequired: form.get("cncRequired") === "yes",
    }).slice(0, 3));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={handleSubmit} className="grid gap-5 border border-forest-900/10 bg-[#f7f8f5] p-6 sm:p-8" aria-labelledby="selector-title">
        <div>
          <p className="eyebrow">Chọn theo nhu cầu</p>
          <h2 id="selector-title" className="mt-3 text-2xl font-extrabold text-forest-950">Bắt đầu từ hạng mục bạn đang làm</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">Chọn vài thông tin ban đầu để biết nhóm nào nên xem trước. Khi hỏi mã cụ thể, vẫn cần chốt theo tấm, bề mặt và phần gia công.</p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-forest-950">Hạng mục<select name="application" defaultValue="cabinetry" className="min-h-12 border border-forest-900/20 bg-white px-3 font-normal"><option value="cabinetry">{labels.application.cabinetry}</option><option value="tabletop">{labels.application.tabletop}</option><option value="shelving">{labels.application.shelving}</option><option value="panel-detail">{labels.application["panel-detail"]}</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-forest-950">Môi trường<select name="moistureExposure" defaultValue="dry" className="min-h-12 border border-forest-900/20 bg-white px-3 font-normal"><option value="dry">{labels.moistureExposure.dry}</option><option value="humid">{labels.moistureExposure.humid}</option><option value="direct-water">{labels.moistureExposure["direct-water"]}</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-forest-950">Bề mặt mong muốn<select name="finishPreference" defaultValue="any" className="min-h-12 border border-forest-900/20 bg-white px-3 font-normal"><option value="any">{labels.finishPreference.any}</option><option value="natural-wood">{labels.finishPreference["natural-wood"]}</option><option value="decorative-surface">{labels.finishPreference["decorative-surface"]}</option></select></label>
        <fieldset className="grid gap-3 text-sm font-bold text-forest-950"><legend>Có cần CNC?</legend><label className="flex items-center gap-2 font-normal"><input type="radio" name="cncRequired" value="no" defaultChecked /> Chưa cần hoặc chưa chốt</label><label className="flex items-center gap-2 font-normal"><input type="radio" name="cncRequired" value="yes" /> Có file/danh sách cần kiểm tra</label></fieldset>
        <button type="submit" className="pressable min-h-12 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem gợi ý vật liệu</button>
      </form>

      <section aria-live="polite" aria-labelledby="selector-result-title" className="border border-forest-900/10 bg-white p-6 sm:p-8">
        <p className="eyebrow">Gợi ý ban đầu</p>
        <h2 id="selector-result-title" className="mt-3 text-2xl font-extrabold text-forest-950">{result ? "Nhóm nên xem trước" : "Bắt đầu bằng bốn thông tin"}</h2>
        {result ? <div className="mt-6 grid gap-4">{result.map((material, index) => <article key={material.slug} className="border border-forest-900/10 p-5"><h3 className="text-lg font-extrabold text-forest-950">{index + 1}. {material.name}</h3><p className="mt-2 text-sm leading-7 text-slate-700">{material.reasons.join(" ") || "Bắt đầu từ hạng mục và quy cách bạn đang có."}</p><p className="mt-3 text-xs leading-6 text-slate-500"><strong>Lưu ý:</strong> {material.caveats.join(" ")}</p></article>)}</div> : <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate-700"><li>Hạng mục: tủ, mặt bàn, kệ hoặc chi tiết dạng tấm.</li><li>Môi trường: khô, có độ ẩm hoặc có nước trực tiếp.</li><li>Bề mặt: vân gỗ tự nhiên, bề mặt phủ hoặc chưa chốt.</li><li>Gia công: có cần cắt, khoan, soi rãnh hay CNC không.</li></ul>}
      </section>
    </div>
  );
}
