import { notFound } from "next/navigation";
import { ProductLanding } from "@/components/content/ProductLanding";
import { getProduct } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
const product = getProduct("go-ghep");
export const metadata = product ? createContentMetadata(product, "/go-ghep") : {};
export default function Page() { if (!product) notFound(); return <ProductLanding product={product} />; }
