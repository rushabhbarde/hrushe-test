import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const canonical = `/collection/${slug}`;

  return {
    title: title || "Collection",
    description: `Explore the HRUSHE ${title || "streetwear"} collection, defined through quiet silhouettes and premium everyday comfort.`,
    alternates: { canonical },
    openGraph: {
      title: `${title || "Collection"} | HRUSHE`,
      description: `Shop the HRUSHE ${title || "streetwear"} collection.`,
      url: canonical,
      type: "website",
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
