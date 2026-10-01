import { getHomepageSectionsForAudience, getVisibleHomepageCards, type HomepageSection } from "@/lib/admin-workspace";
import { splitChapterTitle } from "@/lib/chapters";
import { isVisibleStorefrontProduct, withSideImages, type Product } from "@/lib/catalog";
import { getHomepageManagement, getStorefrontProducts } from "@/lib/server-storefront";
import { ChapterHome, type Chapter, type EditCard } from "@/components/chapter-home";
import type { LookPiece, LookProduct } from "@/components/shop-the-look";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Audience = "women" | "men";

const audienceLabels: Record<Audience, "Women" | "Men"> = {
  women: "Women",
  men: "Men",
};

const campaignSectionTypes = new Set(["audience-hero", "sale-banner"]);

function isSoldOut(product: Product) {
  return (
    product.status === "Sold Out" ||
    product.availability === "sold-out" ||
    Boolean(product.trackInventory && !product.variants?.some((variant) => variant.active && variant.stock > 0))
  );
}

function toLookProduct(product: Product): LookProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    displayName: product.displayName,
    price: product.price,
    colour: product.colour,
    colors: product.colors,
    accent: product.accent,
    images: product.images.slice(0, 1),
    thumbnailUrl: product.thumbnailUrl,
    sizes: product.sizes,
    trackInventory: product.trackInventory,
    variants: product.variants,
    fabric: product.fabric,
    gsm: product.gsm,
    cottonType: product.cottonType,
    fitType: product.fitType,
    modelHeight: product.modelHeight,
    modelWornSize: product.modelWornSize,
  };
}

/** A campaign photo's dots, minus any whose piece is hidden or sold out. */
function toLook(section: HomepageSection, products: Map<string, Product>): LookPiece[] {
  return (section.lookTags || []).flatMap((tag) => {
    const product = products.get(tag.productId);
    if (!product || !isVisibleStorefrontProduct(product) || isSoldOut(product)) {
      return [];
    }
    return [{ id: tag.id, x: tag.x, y: tag.y, mobileX: tag.mobileX ?? null, mobileY: tag.mobileY ?? null, product: toLookProduct(product) }];
  });
}

function toChapter(section: HomepageSection, audience: Audience, products: Map<string, Product>): Chapter {
  const collectionHref = `/collection/${audience}`;
  const title = section.title || "The campaign";
  const [top, bottom] = splitChapterTitle(title);

  return {
    id: section.id,
    label: title,
    top,
    bottom,
    image: section.image || "",
    mobileImage: section.mobileImage || "",
    alt: section.imageAlt || `HRUSHE ${audienceLabels[audience]} · ${title}`,
    objectPosition: section.objectPosition || "center",
    ctaText: section.ctaText && !/new arrival/i.test(section.ctaText) ? section.ctaText : "Shop the campaign",
    ctaLink: !section.ctaLink || section.ctaLink === `/${audience}` ? collectionHref : section.ctaLink,
    look: toLook(section, products),
  };
}

export async function AudienceHomePage({ audience }: { audience: Audience }) {
  const [homeManagement, catalog] = await Promise.all([getHomepageManagement(), getStorefrontProducts()]);
  const products = new Map(
    withSideImages(catalog, audienceLabels[audience]).map((product) => [product.id, product])
  );
  const sections = getHomepageSectionsForAudience(homeManagement, audience);
  const chapters = sections.filter((section) => campaignSectionTypes.has(section.sectionType)).map((section) => toChapter(section, audience, products));
  const categorySection = sections.find((section) => section.sectionType === "category-cards");
  const edit: EditCard[] = categorySection
    ? getVisibleHomepageCards(categorySection.cards).map((card) => ({
        id: card.id,
        title: card.title,
        image: card.image,
        mobileImage: card.mobileImage,
        objectPosition: card.objectPosition || "center",
        href: card.ctaLink || `/collection/${audience}`,
      }))
    : [];

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <h1 className="sr-only">HRUSHE {audienceLabels[audience]}</h1>
        <ChapterHome
          side={audienceLabels[audience]}
          chapters={chapters.length > 0 ? chapters : [toChapter({ title: "The edit" } as HomepageSection, audience, products)]}
          edit={edit}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
