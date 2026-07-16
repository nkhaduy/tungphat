"use client";

import Script from "next/script";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Send } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

declare global {
  interface Window { turnstile?: { reset: (element?: HTMLElement | string) => void } }
}

type LeadFormProps = { type: "contact" | "quote"; compact?: boolean };

const materials = ["", "Gỗ ghép", "Gỗ ghép cao su", "Gỗ ghép tràm", "Ván MDF", "MDF chống ẩm", "Ván gỗ công nghiệp khác", "Gia công CNC gỗ", "Gia công CNC MDF"];

function getTracking() {
  const params = new URLSearchParams(window.location.search);
  return {
    source_url: window.location.href,
    referrer: document.referrer,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || ""
  };
}

export function LeadForm({ type, compact = false }: LeadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || !siteKey) return;
    const form = new FormData(event.currentTarget);
    const token = String(form.get("cf-turnstile-response") || "");
    if (!token) { setStatus("error"); setMessage("Vui lòng hoàn tất bước xác minh chống spam."); return; }
    setStatus("submitting"); setMessage("");
    const data = Object.fromEntries(form.entries());
    const payload = {
      ...data,
      ...getTracking(),
      submission_id: submissionId,
      consent: form.get("consent") === "on",
      turnstile_token: token
    };
    delete (payload as Record<string, unknown>)["cf-turnstile-response"];
    try {
      const response = await fetch(`/api/${type}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const result: { ok?: boolean; code?: string } = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.code || "request_failed");
      setStatus("success");
      setMessage(type === "quote" ? "Tùng Phát đã nhận yêu cầu báo giá và sẽ liên hệ theo thông tin bạn cung cấp." : "Tùng Phát đã nhận thông tin liên hệ của bạn.");
      trackEvent(type === "quote" ? "submit_quote_form" : "submit_contact_form", { form_type: type });
      formRef.current?.reset();
      setSubmissionId(crypto.randomUUID());
      window.turnstile?.reset("#lead-turnstile");
    } catch (error) {
      const code = error instanceof Error ? error.message : "request_failed";
      setStatus("error");
      setMessage(code === "rate_limited" ? "Bạn đã gửi nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 10 phút." : code === "verification_failed" ? "Phiên xác minh đã hết hạn hoặc không hợp lệ. Vui lòng xác minh lại." : "Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ qua điện thoại/Zalo.");
      window.turnstile?.reset("#lead-turnstile");
    }
  }

  const inputClass = "mt-2 min-h-12 w-full border border-forest-900/20 bg-white px-4 text-sm text-forest-950";
  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm sm:p-7" noValidate={false}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-forest-950">Họ và tên <span aria-hidden="true" className="text-wood-700">*</span><input className={inputClass} name="full_name" required minLength={2} maxLength={100} autoComplete="name" /></label>
        <label className="text-sm font-bold text-forest-950">Số điện thoại <span aria-hidden="true" className="text-wood-700">*</span><input className={inputClass} name="phone" type="tel" required minLength={9} maxLength={30} inputMode="tel" autoComplete="tel" /></label>
        {!compact && <label className="text-sm font-bold text-forest-950">Email<input className={inputClass} name="email" type="email" maxLength={160} autoComplete="email" /></label>}
        {!compact && <label className="text-sm font-bold text-forest-950">Công ty / xưởng<input className={inputClass} name="company" maxLength={160} autoComplete="organization" /></label>}
        <label className="text-sm font-bold text-forest-950">Khu vực<input className={inputClass} name="city" maxLength={100} autoComplete="address-level2" placeholder="Ví dụ: TP.HCM" /></label>
        <label className="text-sm font-bold text-forest-950">Vật liệu / nhu cầu<select className={inputClass} name="material" required={type === "quote"}>{materials.map((item) => <option key={item} value={item}>{item || "Chọn nhu cầu"}</option>)}</select></label>
        {type === "quote" && <><label className="text-sm font-bold text-forest-950">Độ dày<input className={inputClass} name="thickness" maxLength={80} placeholder="Nếu đã xác định" /></label><label className="text-sm font-bold text-forest-950">Số lượng<input className={inputClass} name="quantity" maxLength={100} placeholder="Số tấm hoặc số chi tiết" /></label></>}
      </div>
      {type === "quote" && <label className="mt-5 block text-sm font-bold text-forest-950">Yêu cầu CNC<textarea className={`${inputClass} min-h-28 py-3`} name="cnc_requirement" maxLength={800} placeholder="Mô tả hạng mục; website chưa nhận file trực tiếp" /></label>}
      <label className="mt-5 block text-sm font-bold text-forest-950">Nội dung cần trao đổi<textarea className={`${inputClass} min-h-32 py-3`} name="message" maxLength={2000} required={type === "contact"} /></label>
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600"><input className="mt-1 h-5 w-5 shrink-0 accent-[#b84d00]" type="checkbox" name="consent" required /> <span>Tôi đồng ý để Tùng Phát lưu và xử lý thông tin nhằm phản hồi yêu cầu này theo <Link href="/chinh-sach-bao-mat" className="font-bold text-forest-950 underline">Chính sách bảo mật</Link>.</span></label>
      {siteKey ? <div id="lead-turnstile" className="cf-turnstile mt-6" data-sitekey={siteKey} data-action="turnstile-spin-v1" data-response-field-name="cf-turnstile-response" data-retry="auto" data-refresh-expired="auto" /> : <p className="mt-6 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Form sẽ hoạt động sau khi cấu hình <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>.</p>}
      <button type="submit" disabled={status === "submitting" || !siteKey} className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 bg-wood-700 px-6 py-4 text-sm font-bold text-white transition hover:bg-wood-800 disabled:cursor-not-allowed disabled:opacity-55"><Send size={17} />{status === "submitting" ? "Đang gửi…" : type === "quote" ? "Gửi yêu cầu báo giá" : "Gửi thông tin liên hệ"}</button>
      {message && <p role="status" aria-live="polite" className={`mt-4 text-sm leading-6 ${status === "success" ? "text-forest-800" : "text-red-700"}`}>{message}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Không tải bản vẽ tại đây. Không gửi mật khẩu, thông tin thanh toán hoặc dữ liệu nhạy cảm trong nội dung form.</p>
    </form>
  );
}
