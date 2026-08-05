import { CodeInquiryActions } from "@/components/catalog/CodeInquiryActions";

type ProductCodeActionsProps = { code: string };

export function ProductCodeActions({ code }: ProductCodeActionsProps) {
  return <CodeInquiryActions code={code} supplierName="Thanh Thuỳ" />;
}
