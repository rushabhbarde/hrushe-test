import { getHomepageSectionsForAudience, getVisibleHomepageCards, type HomepageSection } from "@/lib/admin-workspace";
import { splitChapterTitle } from "@/lib/chapters";
import { getHomepageManagement } from "@/lib/server-storefront";
import { ChapterHome, type Chapter, type EditCard } from "@/components/chapter-home";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Audience = "women" | "men";

const audienceLabels: Record<Audience, "Women" | "Men"> = {
  women: "Women",
  men: "Men",
};

const campaignSectionTypes = new Set(["audience-hero", "sale-banner"]);

function toChapter(section: HomepageSection, audience: Audience): Chapter {
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
  };
}

export async function AudienceHomePage({ audience }: { audience: Audience }) {
  const homeManagement = await getHomepageManagement();
  const sections = getHomepageSectionsForAudience(homeManagement, audience);
  const chapters = sections.filter((section) => campaignSectionTypes.has(section.sectionType)).map((section) => toChapter(section, audience));
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
          chapters={chapters.length > 0 ? chapters : [toChapter({ title: "The edit" } as HomepageSection, audience)]}
          edit={edit}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
