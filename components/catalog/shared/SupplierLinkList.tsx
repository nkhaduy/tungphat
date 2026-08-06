"use client";

import Link from "next/link";
import type { SupplierNavigationLink } from "@/lib/catalog/core/navigation";

type SupplierLinkListProps = {
  links: SupplierNavigationLink[];
  className: string;
  onNavigate?: (href: string) => void;
};

export function SupplierLinkList({
  links,
  className,
  onNavigate,
}: SupplierLinkListProps) {
  return links.map((link) => (
    <Link
      key={link.supplierId}
      href={link.href}
      onClick={() => onNavigate?.(link.href)}
      className={className}
    >
      {link.label}
    </Link>
  ));
}
