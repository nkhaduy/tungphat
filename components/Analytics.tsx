"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { ga4BootstrapScript } from "@/lib/analytics/ga4-bootstrap";

export function Analytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (pathname?.startsWith("/cms-preview") || !measurementId || !/^G-[A-Z0-9]{6,}$/i.test(measurementId)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-config" strategy="lazyOnload">
        {ga4BootstrapScript(measurementId)}
      </Script>
    </>
  );
}
