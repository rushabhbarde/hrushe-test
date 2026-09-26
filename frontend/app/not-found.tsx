import { FrameStatement } from "@/components/frame-statement";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <FrameStatement
        kicker="404"
        words={["Nothing", "here."]}
        body="The page may have moved, or the piece is no longer in the edit."
        actions={[
          { href: "/shop", label: "See the edit" },
          { href: "/search", label: "Search" },
          { href: "/?choose", label: "Women / Men" },
        ]}
      />
      <SiteFooter />
    </div>
  );
}
