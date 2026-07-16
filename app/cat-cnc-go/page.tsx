import { notFound } from "next/navigation";
import { ServiceLanding } from "@/components/content/ServiceLanding";
import { getServicePage } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
const entry = getServicePage("cat-cnc-go");
export const metadata = entry ? createContentMetadata(entry, "/cat-cnc-go") : {};
export default function Page() { if (!entry) notFound(); return <ServiceLanding page={entry} />; }
