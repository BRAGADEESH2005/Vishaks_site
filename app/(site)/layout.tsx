import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Cursor } from "@/components/ui/Cursor";
import { SiteLoader } from "@/components/ui/SiteLoader";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteLoader />
      {/* Without JavaScript nothing can report progress, so the loader is hidden. */}
      <noscript>
        <style>{"#site-loader{display:none}"}</style>
      </noscript>
      <SmoothScroll />
      <Cursor />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
