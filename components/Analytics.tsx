"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

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
        {`if(!document.cookie.split(';').some(function(v){return v.trim()==='tp_analytics_opt_out=1'})){window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true,send_page_view:false})}`}
      </Script>
    </>
  );
}
