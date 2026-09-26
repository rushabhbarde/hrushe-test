import Link from "next/link";
import {
  getHomepageSectionsForAudience,
  getVisibleHomepageCards,
  type HomepageSection,
} from "@/lib/admin-workspace";
import { getCollectionProducts, getNewInProducts, withSideImages, type Product } from "@/lib/catalog";
import { getHomepageManagement, getStorefrontProducts } from "@/lib/server-storefront";
import { FrameHome, type FrameHomeCampaign } from "@/components/frame-home";
import { HomepageMediaFrame } from "@/components/homepage-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Audience = "women" | "men";

const audienceLabels: Record<Audience, "Women" | "Men"> = {
  women: "Women",
  men: "Men",
};

function toCampaign(section: HomepageSection | undefined, audience: Audience): FrameHomeCampaign {
  const collectionHref = `/collection/${audience}`;
  const ctaLink = !section?.ctaLink || section.ctaLink === `/${audience}` ? collectionHref : section.ctaLink;

  return {
    title: section?.title || "The campaign",
    image: section?.image || "",
    mobileImage: section?.mobileImage || "",
    imageAlt: section?.imageAlt || `HRUSHE ${audienceLabels[audience]} campaign`,
    objectPosition: section?.objectPosition || "center",
    ctaText: section?.ctaText && !/new arrival/i.test(section.ctaText) ? section.ctaText : "Shop the campaign",
    ctaLink,
  };
}

function CategoryFrames({ section, audience }: { section: HomepageSection; audience: Audience }) {
  const cards = getVisibleHomepageCards(section.cards);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section aria-label={section.title || "Categories"} className="px-5 pb-16 pt-6 lg:px-10 lg:pb-24">
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
        {cards.map((card) => (
          <Link key={card.id} href={card.ctaLink || `/collection/${audience}`} className="group flex flex-col gap-3">
            <span className="fr-frame block aspect-[3/4] w-full">
              <span className="fr-frame__layer is-active">
                <HomepageMediaFrame
                  src={card.image}
                  mobileSrc={card.mobileImage}
                  alt={card.imageAlt || card.title}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                  objectPosition={card.objectPosition}
                />
              </span>
            </span>
            <span className="fr-word text-[1.4rem] lg:text-[2rem]">{card.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function AudienceHomePage({ audience }: { audience: Audience }) {
  const [homeManagement, allProducts] = await Promise.all([getHomepageManagement(), getStorefrontProducts()]);
  const sections = getHomepageSectionsForAudience(homeManagement, audience);
  const hero = sections.find((section) => section.sectionType === "audience-hero");
  const side = audienceLabels[audience];
  const sideProducts: Product[] = getCollectionProducts(allProducts, side);
  const products = withSideImages(sideProducts.length > 0 ? sideProducts : getNewInProducts(allProducts), side);

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <FrameHome side={side} campaign={toCampaign(hero, audience)} products={products} />
        {sections
          .filter((section) => section.sectionType === "category-cards")
          .map((section) => (
            <CategoryFrames key={section.id} section={section} audience={audience} />
          ))}
      </main>
      <SiteFooter />
    </div>
  );
}
