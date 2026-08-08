"use client";

import { useState } from "react";

export function CopyColorCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); } }} className="mt-7 min-h-12 w-full border border-forest-900/15 px-4 text-sm font-extrabold text-forest-950">{copied ? "Đã sao chép" : "Sao chép mã"}</button>;
}
