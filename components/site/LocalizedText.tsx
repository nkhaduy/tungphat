"use client";

import { useLang } from "@/lib/i18n-context";

export function LocalizedText({ vi, en }: { vi: string; en: string }) {
  const { lang } = useLang();
  return <>{lang === "vi" ? vi : en}</>;
}
