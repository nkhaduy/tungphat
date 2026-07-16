import { notFound } from "next/navigation";
import { ProductLanding } from "@/components/content/ProductLanding";
import { getProduct } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
const product = getProduct("go-ghep-cao-su");
export const metadata = product ? createContentMetadata(product, "/go-ghep-cao-su") : {};
export default function Page() { if (!product) notFound(); return <ProductLanding product={product} />; }
