import type { Metadata } from "next";
import {
  getHomepageSectionsForAudience,
  getVisibleHomepageCards,
} from "@/lib/admin-workspace";
import { getHomepageManagement } from "@/lib/server-storefront";
import { SiteFooter } from "@/components/site-footer";
import { Gateway } from "@/components/gateway";
import { toGatewayOption } from "@/lib/gateway";

export const metadata: Metadata = {
  title: "Shop Women & Men",
  description: "Choose HRUSHE womenswear or menswear and shop the latest quiet uniforms.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shop Women & Men | HRUSHE",
    description: "Choose HRUSHE womenswear or menswear and shop the latest quiet uniforms.",
    url: "/",
  },
};

export default async function Home() {
  const homeManagement = await getHomepageManagement();
  const entrySection = getHomepageSectionsForAudience(homeManagement, "home").find(
    (section) => section.sectionType === "entry-cards"
  );
  const entryCards = entrySection ? getVisibleHomepageCards(entrySection.cards) : [];

  const options = entryCards.map(toGatewayOption);

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="sr-only">HRUSHE women and men collections</h1>
      <Gateway options={options} />
      <div className="bg-[var(--foreground)]">
        <SiteFooter compact />
      </div>
    </main>
  );
}
