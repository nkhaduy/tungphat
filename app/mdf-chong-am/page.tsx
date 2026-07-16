import { notFound } from "next/navigation";
import { ProductLanding } from "@/components/content/ProductLanding";
import { getProduct } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
const product = getProduct("mdf-chong-am");
export const metadata = product ? createContentMetadata(product, "/mdf-chong-am") : {};
export default function Page() { if (!product) notFound(); return <ProductLanding product={product} />; }
