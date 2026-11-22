/** Initialize the destination before replaying events emitted during lazy loading. */
export function ga4BootstrapScript(measurementId: string): string {
  if (!/^G-[A-Z0-9]{6,}$/i.test(measurementId)) return "";
  return `if(document.cookie.split(';').some(function(v){return v.trim()==='tp_analytics_opt_out=1'})){window.__TP_GA4_PENDING__=[]}else{window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${measurementId}',{anonymize_ip:true,send_page_view:false});(window.__TP_GA4_PENDING__||[]).forEach(function(args){window.gtag.apply(null,args)});window.__TP_GA4_PENDING__=[]}`;
}
