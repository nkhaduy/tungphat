"use client";

import { ArrowLeft, ArrowRight, Check, ClipboardCheck, MessageCircle, RotateCcw } from "lucide-react";
import { FormEvent, useState } from "react";
import { ZALO_URL } from "@/lib/seo";

const services = ["Mua ván nguyên tấm", "Cắt ván theo kích thước", "Gia công CNC theo file", "Tìm mã màu và bề mặt"] as const;
const materials = ["MDF", "MDF chống ẩm", "MFC", "Plywood", "Gỗ ghép cao su", "Gỗ ghép tràm", "Chưa biết, cần tư vấn"] as const;

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 text-left text-sm font-extrabold transition ${selected ? "border-forest-900 bg-forest-900 text-white shadow-[0_8px_20px_rgba(7,59,40,.14)]" : "border-forest-900/15 bg-white text-forest-950 hover:border-wood-500/60 hover:bg-[#fffaf5]"}`}
    >
      <span>{label}</span>
      {selected ? <Check size={18} aria-hidden="true" /> : <ArrowRight size={17} className="text-wood-600" aria-hidden="true" />}
    </button>
  );
}

export function RequirementFinder() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [service, setService] = useState("");
  const [material, setMaterial] = useState("");
  const [thickness, setThickness] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [preparedMessage, setPreparedMessage] = useState("");

  function chooseService(value: string) {
    setService(value);
    setStatus("idle");
    setStep(2);
  }

  function chooseMaterial(value: string) {
    setMaterial(value);
    setStatus("idle");
    setStep(3);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !material || !phone.trim()) {
      setStatus("error");
      setStatusMessage("Vui lòng chọn đủ nhu cầu, vật liệu và số điện thoại/Zalo.");
      return;
    }
    if (!dimensions.trim() && !message.trim()) {
      setStatus("error");
      setStatusMessage("Vui lòng ghi kích thước hoặc nội dung yêu cầu để Tùng Phát kiểm tra.");
      return;
    }

    const structured = [
      "YÊU CẦU TÙNG PHÁT",
      `Nhu cầu: ${service}`,
      `Vật liệu: ${material}`,
      `Độ dày: ${thickness.trim() || "Chưa xác định"}`,
      `Kích thước: ${dimensions.trim() || "Chưa xác định"}`,
      `Số lượng: ${quantity.trim() || "Chưa xác định"}`,
      `Nội dung: ${message.trim() || "Chưa có ghi chú thêm"}`,
      `Số điện thoại/Zalo: ${phone.trim()}`
    ].join("\n");

    setPreparedMessage(structured);
    setStatus("success");
    setStatusMessage("Đã chuẩn bị nội dung có cấu trúc và mở Zalo. Nếu chưa tự sao chép, bạn có thể copy khối nội dung bên dưới.");
    window.open(ZALO_URL, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard?.writeText(structured);
    } catch {
      // Clipboard can be blocked in private browsing; the editable preview remains available.
    }
  }

  return (
    <section id="requirement-finder" aria-labelledby="requirement-finder-title" className="scroll-mt-24 bg-[#f7f9f6] py-14 sm:py-16 lg:py-20">
      <div className="container-shell">
        <div className="mx-auto max-w-4xl rounded-2xl border border-forest-900/10 bg-white p-6 shadow-[0_18px_50px_rgba(7,59,40,.08)] sm:p-9 lg:p-11">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Công cụ gửi yêu cầu nhanh</p>
              <h2 id="requirement-finder-title" className="text-balance mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-.04em] text-forest-950 sm:text-4xl">Tìm đúng vật liệu hoặc dịch vụ trong 30 giây</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">Chọn nhu cầu và vật liệu trước, sau đó gửi vài thông tin tối thiểu để mở sẵn cuộc trò chuyện với Tùng Phát.</p>
            </div>
            <span className="inline-flex min-h-9 items-center gap-2 self-start rounded-full bg-[#edf4ef] px-3 text-xs font-extrabold text-forest-900 sm:self-auto">Bước {step}/3</span>
          </div>

          <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-forest-900/10" aria-hidden="true"><span className="block h-full rounded-full bg-wood-500 transition-all duration-200" style={{ width: `${(step / 3) * 100}%` }} /></div>

          {step === 1 ? (
            <div className="mt-8" aria-labelledby="finder-step-one">
              <h3 id="finder-step-one" className="text-lg font-extrabold text-forest-950">Bước 1 · Bạn đang cần gì?</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((option) => <ChoiceButton key={option} label={option} selected={service === option} onClick={() => chooseService(option)} />)}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-8" aria-labelledby="finder-step-two">
              <div className="flex items-center justify-between gap-4"><h3 id="finder-step-two" className="text-lg font-extrabold text-forest-950">Bước 2 · Bạn đang quan tâm vật liệu nào?</h3><button type="button" onClick={() => setStep(1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-900 hover:text-wood-600"><ArrowLeft size={16} aria-hidden="true" /> Quay lại</button></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((option) => <ChoiceButton key={option} label={option} selected={material === option} onClick={() => chooseMaterial(option)} />)}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <form className="mt-8" onSubmit={handleSubmit} aria-labelledby="finder-step-three">
              <div className="flex items-center justify-between gap-4"><h3 id="finder-step-three" className="text-lg font-extrabold text-forest-950">Bước 3 · Gửi thông tin tối thiểu</h3><button type="button" onClick={() => setStep(2)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-900 hover:text-wood-600"><ArrowLeft size={16} aria-hidden="true" /> Quay lại</button></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-forest-950">Độ dày<input name="thickness" aria-label="Độ dày" value={thickness} onChange={(event) => setThickness(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-forest-900/15 bg-white px-4 text-sm font-normal" placeholder="Nếu đã xác định…" autoComplete="off" /></label>
                <label className="text-sm font-bold text-forest-950">Kích thước<input name="dimensions" aria-label="Kích thước" value={dimensions} onChange={(event) => setDimensions(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-forest-900/15 bg-white px-4 text-sm font-normal" placeholder="Ví dụ: 600 × 1200 mm…" autoComplete="off" /></label>
                <label className="text-sm font-bold text-forest-950">Số lượng<input name="quantity" aria-label="Số lượng" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-forest-900/15 bg-white px-4 text-sm font-normal" placeholder="Ví dụ: 12 chi tiết…" autoComplete="off" /></label>
                <label className="text-sm font-bold text-forest-950">Số điện thoại/Zalo <span aria-hidden="true" className="text-wood-600">*</span><input name="phone" aria-label="Số điện thoại hoặc Zalo" required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-forest-900/15 bg-white px-4 text-sm font-normal" type="tel" inputMode="tel" autoComplete="tel" /></label>
              </div>
              <label className="mt-4 block text-sm font-bold text-forest-950">Nội dung yêu cầu<textarea name="message" aria-label="Nội dung yêu cầu" value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-forest-900/15 bg-white px-4 py-3 text-sm font-normal" placeholder="Ví dụ: soi rãnh theo file DXF, cần kiểm tra mã bề mặt…" autoComplete="off" /></label>
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><ClipboardCheck size={16} className="mt-0.5 shrink-0 text-forest-800" aria-hidden="true" />Website hiện chưa hỗ trợ upload file trực tiếp. Sau khi mở Zalo, bạn có thể gửi file kỹ thuật tại đó.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-wood-500 px-6 text-sm font-extrabold text-white transition hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" /> Chuẩn bị nội dung và mở Zalo</button><button type="button" onClick={() => { setStep(1); setService(""); setMaterial(""); setStatus("idle"); }} className="inline-flex min-h-12 items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-forest-950"><RotateCcw size={16} aria-hidden="true" /> Làm lại</button></div>
            </form>
          ) : null}

          {statusMessage ? <p role={status === "error" ? "alert" : "status"} aria-live="polite" className={`mt-5 text-sm leading-6 ${status === "error" ? "text-red-700" : "text-forest-800"}`}>{statusMessage}</p> : null}
          {status === "success" ? <label className="mt-4 block text-sm font-bold text-forest-950">Nội dung đã chuẩn bị<textarea readOnly value={preparedMessage} className="mt-2 min-h-40 w-full rounded-md border border-forest-900/15 bg-[#f7f9f6] px-4 py-3 text-xs font-normal leading-5 text-slate-700" /></label> : null}
        </div>
      </div>
    </section>
  );
}
