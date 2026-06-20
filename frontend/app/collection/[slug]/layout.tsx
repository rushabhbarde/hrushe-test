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
    description: `Explore the HRUSHE ${title || "streetwear"} collection: premium minimal pieces, quiet silhouettes, and everyday comfort.`,
    alternates: { canonical },
    openGraph: {
      title: `${title || "Collection"} | HRUSHE`,
      description: `Shop the HRUSHE ${title || "streetwear"} collection of premium minimal essentials.`,
      url: canonical,
      type: "website",
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
