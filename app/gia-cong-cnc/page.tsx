import { CncServiceContent, cncServiceCopy } from "@/components/content/CncServiceContent";
import { createPageMetadata } from "@/lib/seo";
const copy = cncServiceCopy["gia-cong-cnc"];
export const metadata = createPageMetadata({ title: copy.title, description: copy.description, path: "/gia-cong-cnc" });
export default function CncServicePage() { return <CncServiceContent slug="gia-cong-cnc" />; }
