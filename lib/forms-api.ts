export type LeadFormType = "contact" | "quote";

function configuredBaseUrl() {
  return (process.env.NEXT_PUBLIC_FORMS_API_BASE || "").trim().replace(/\/+$/, "");
}

export function formsApiUrl(type: LeadFormType) {
  const base = configuredBaseUrl();
  return base ? `${base}/api/${type}` : `/api/${type}`;
}
