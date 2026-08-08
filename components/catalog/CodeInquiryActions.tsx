"use client";

import { Check, Copy, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

type CodeInquiryActionsProps = {
  code: string;
  supplierName: string;
};

export function CodeInquiryActions({
  code,
  supplierName,
}: CodeInquiryActionsProps) {
  const [status, setStatus] = useState("");
  const copied = status.startsWith("Đã sao chép");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus(`Đã sao chép mã ${code}`);
      window.setTimeout(() => setStatus(""), 1800);
    } catch {
      setStatus("Không thể sao chép mã. Hãy chọn và sao chép thủ công.");
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
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
        <a
          href={buildSupplierZaloInquiryUrl(ZALO_URL, supplierName, code)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Gửi mã ${code} của ${supplierName} qua Zalo`}
          className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-bold text-white transition-colors hover:bg-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2 active:scale-[.98]"
        >
          <MessageCircle aria-hidden="true" size={17} /> Nhắn Zalo
        </a>
        <a
          href={PHONE_HREF}
          className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-forest-900/15 bg-white px-6 text-sm font-bold text-forest-950 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2 active:scale-[.98]"
        >
          <Phone aria-hidden="true" size={17} /> Kiểm tra tồn kho
        </a>
      </div>
      <p
        className="mt-2 min-h-5 text-sm font-bold text-wood-700"
        aria-live="polite"
      >
        {status}
      </p>
    </div>
  );
}
