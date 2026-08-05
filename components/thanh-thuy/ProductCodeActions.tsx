"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

type ProductCodeActionsProps = { code: string; zaloUrl: string };

export function ProductCodeActions({ code, zaloUrl }: ProductCodeActionsProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 bg-[#b84f05] px-6 text-sm font-bold text-white transition-colors hover:bg-[#963f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2 active:scale-[.98]"
      >
        <MessageCircle aria-hidden="true" size={17} /> Gửi mã qua Zalo
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-forest-900/15 bg-white px-6 text-sm font-bold text-forest-950 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2 active:scale-[.98]"
        aria-label={`Sao chép mã ${code}`}
      >
        {copied ? (
          <Check aria-hidden="true" size={17} />
        ) : (
          <Copy aria-hidden="true" size={17} />
        )}
        {copied ? "Đã sao chép" : "Sao chép mã"}
      </button>
    </div>
  );
}
