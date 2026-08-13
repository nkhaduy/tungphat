import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StickyMobileActions } from "@/components/site/StickyMobileActions";
import { PageTransition } from "@/components/PageTransition";
import type { SiteHeaderTone } from "@/lib/site-header";

type SiteShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  thirdMobileAction?: { href: string; label: string };
  headerTone?: SiteHeaderTone;
};

export function SiteShell({ children, mainClassName = "", thirdMobileAction, headerTone = "light" }: SiteShellProps) {
  return (
    <>
      <a href="#noi-dung-chinh" className="fixed left-3 top-3 z-[100] -translate-y-24 bg-white px-4 py-3 text-sm font-bold text-forest-950 shadow-card transition-transform focus:translate-y-0">Bỏ qua điều hướng</a>
      <SiteHeader tone={headerTone} />
      <main id="noi-dung-chinh" className={mainClassName}><PageTransition>{children}</PageTransition></main>
      <SiteFooter />
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" />
      <StickyMobileActions thirdHref={thirdMobileAction?.href} thirdLabel={thirdMobileAction?.label} />
    </>
  );
}
