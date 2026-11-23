"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { ga4BootstrapScript } from "@/lib/analytics/ga4-bootstrap";
import { shouldLoadGa4 } from "@/lib/analytics/config";

export function Analytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!shouldLoadGa4({ pathname, measurementId })) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId!}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-config" strategy="lazyOnload">
        {ga4BootstrapScript(measurementId!)}
      </Script>
    </>
  );
}
