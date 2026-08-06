import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StickyMobileActions } from "@/components/site/StickyMobileActions";

type SiteShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  thirdMobileAction?: { href: string; label: string };
};

export function SiteShell({ children, mainClassName = "", thirdMobileAction }: SiteShellProps) {
  return (
    <>
      <a href="#noi-dung-chinh" className="fixed left-3 top-3 z-[100] -translate-y-24 bg-white px-4 py-3 text-sm font-bold text-forest-950 shadow-card transition-transform focus:translate-y-0">Bỏ qua điều hướng</a>
      <SiteHeader />
      <main id="noi-dung-chinh" className={mainClassName}>{children}</main>
      <SiteFooter />
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" />
      <StickyMobileActions thirdHref={thirdMobileAction?.href} thirdLabel={thirdMobileAction?.label} />
    </>
  );
}
