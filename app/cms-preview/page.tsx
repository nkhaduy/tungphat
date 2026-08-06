"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArticleLanding } from "@/components/content/ArticleLanding";
import { ProductLanding } from "@/components/content/ProductLanding";
import { ProjectLanding } from "@/components/content/ProjectLanding";
import { ServiceLanding } from "@/components/content/ServiceLanding";
import { previewEntry, sanitizeCmsPreviewDraft, type CmsPreviewDraft } from "@/lib/cms-preview";

declare global { interface Window { __TP_PREVIEW__?: boolean } }

function trustedParent(origin: string) {
  return new Set([
    "https://cms.mdftungphat.com",
    "https://tungphat-cms.pages.dev",
    "https://preview.tungphat-cms.pages.dev",
    "http://127.0.0.1:4174",
    "http://localhost:4174",
  ]).has(origin);
}

function referrerParentOrigin() {
  try {
    const origin = new URL(document.referrer).origin;
    return trustedParent(origin) ? origin : "";
  } catch { return ""; }
}

export default function CmsPreviewPage() {
  if (typeof window !== "undefined") window.__TP_PREVIEW__ = true;
  const [draft, setDraft] = useState<CmsPreviewDraft | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const referrerOrigin = referrerParentOrigin();
    if (window.parent === window) return;
    const onMessage = (event: MessageEvent) => {
      if (!trustedParent(event.origin) || event.source !== window.parent) return;
      if (event.data?.type === "tp-preview-init") {
        window.parent.postMessage({ type: "tp-preview-ready" }, event.origin);
        return;
      }
      if (event.data?.type !== "tp-preview-draft") return;
      const next = sanitizeCmsPreviewDraft(event.data.payload);
      if (next) setDraft(next);
    };
    window.addEventListener("message", onMessage);
    if (referrerOrigin) window.parent.postMessage({ type: "tp-preview-ready" }, referrerOrigin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const disableAction = (event: Event) => {
      const selector = event.type === "submit" ? "form" : "a, button[type='submit'], input[type='submit']";
      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setNotice("Liên kết bị vô hiệu hóa trong chế độ xem trước.");
      window.setTimeout(() => setNotice(""), 2_400);
    };
    document.addEventListener("click", disableAction, true);
    document.addEventListener("submit", disableAction, true);
    return () => {
      document.removeEventListener("click", disableAction, true);
      document.removeEventListener("submit", disableAction, true);
    };
  }, []);

  const rendered = useMemo(() => draft ? previewEntry(draft) : null, [draft]);
  if (!rendered) return <main className="grid min-h-screen place-items-center bg-[#f5f7f5] p-6 text-center text-forest-950"><div><Image src="/logo-horizontal.webp" width="800" height="240" priority alt="Tùng Phát" className="mx-auto h-auto w-[min(320px,80vw)]" /><p className="mt-8 text-sm font-semibold text-slate-600">Mở một nội dung trong CMS để xem bản nháp.</p></div></main>;

  return (
    <div data-cms-preview="true">
      {rendered.collection === "articles" ? <ArticleLanding article={rendered.entry} /> : null}
      {rendered.collection === "products" ? <ProductLanding product={rendered.entry} /> : null}
      {rendered.collection === "projects" ? <ProjectLanding project={rendered.entry} /> : null}
      {rendered.collection === "pages" ? <ServiceLanding page={rendered.entry} /> : null}
      <p role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 bg-forest-950 px-4 py-3 text-center text-sm font-bold text-white shadow-md transition-opacity ${notice ? "opacity-100" : "pointer-events-none opacity-0"}`}>{notice}</p>
    </div>
  );
}
