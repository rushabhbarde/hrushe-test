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
  const canonical = `https://hrushe.in/collection/${slug}`;

  return {
    title: title ? `${title} Collection` : "Collection",
    description: `Explore the HRUSHE ${title || "clothing"} collection, including available fits, colours, and materials.`,
    alternates: { canonical },
    openGraph: {
      title: `${title || "Collection"} | HRUSHE`,
      description: `Shop the HRUSHE ${title || "clothing"} collection and review each product's fit and material details.`,
      url: canonical,
      type: "website",
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
