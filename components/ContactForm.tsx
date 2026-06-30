"use client";

import { FileUp, Send } from "lucide-react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

export function ContactForm() {
  const { lang } = useLang();
  const t = translations[lang];
  const field = "h-14 w-full border border-slate-300 bg-white px-4 text-sm text-ink placeholder:text-slate-600";

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
      <label className="text-sm font-bold text-forest-950">{t.formName}<input required name="name" autoComplete="name" className={`${field} mt-2`} placeholder={t.formNamePlaceholder} /></label>
      <label className="text-sm font-bold text-forest-950">{t.formPhone}<input required name="phone" autoComplete="tel" className={`${field} mt-2`} placeholder={t.formPhonePlaceholder} type="tel" /></label>
      <label className="text-sm font-bold text-forest-950">{t.formNeed}<select name="request" className={`${field} mt-2`} defaultValue=""><option value="" disabled>{t.formNeedPlaceholder}</option><option>{t.formNeedMaterial}</option><option>{t.formNeedCNC}</option><option>{t.formNeedBoth}</option></select></label>
      <label className="text-sm font-bold text-forest-950">{t.formQuantity}<input name="quantity" className={`${field} mt-2`} placeholder={t.formQuantityPlaceholder} /></label>
      <label className="text-sm font-bold text-forest-950 sm:col-span-2">{t.formMessage}<textarea name="message" className="mt-2 min-h-32 w-full border border-slate-300 bg-white p-4 text-sm placeholder:text-slate-600" placeholder={t.formMessagePlaceholder} /></label>
      <label className="flex min-h-16 cursor-pointer items-center gap-3 border border-dashed border-forest-900/35 px-4 text-sm font-semibold text-slate-700 sm:col-span-2"><FileUp size={20} className="text-wood-600" /><span>{t.formFileUpload}</span><input type="file" accept=".dxf,.dwg,.pdf,.ai,.cdr,image/*" className="sr-only" /></label>
      <button className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-bold text-white transition hover:bg-wood-600 sm:col-span-2">{t.formSubmit} <Send size={17} /></button>
    </form>
  );
}