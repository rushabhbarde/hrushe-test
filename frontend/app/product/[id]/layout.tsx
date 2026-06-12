import type { Metadata } from "next";
import type { Product } from "@/lib/catalog";
import { cache } from "react";

const BACKEND_API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

function buildDescription(product: Product) {
  const description = product.description.replace(/\s+/g, " ").trim();

  if (description.length <= 155) {
    return description;
  }

  const clipped = description.slice(0, 155);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : 155).trim()}...`;
}

function getMetadataImage(product: Product) {
  const image = product.images?.[0] || "";
  return image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")
    ? image
    : "";
}

const getProduct = cache(async (id: string) => {
  const response = await fetch(`${BACKEND_API_URL}/products/${encodeURIComponent(id)}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Product request failed");
  }

  return (await response.json()) as Product;
});

export async function generateMetadata({
  params,
}: Omit<ProductLayoutProps, "children">): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await getProduct(id);
    const description = buildDescription(product);
    const canonicalPath = `/product/${product.slug || id}`;
    const image = getMetadataImage(product);

    return {
      title: product.name,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `${product.name} | HRUSHE`,
        description,
        url: canonicalPath,
        type: "website",
        ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: `${product.name} | HRUSHE`,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {
      title: "Product",
      description: "View HRUSHE product details, sizing, fabric notes, reviews, and related pieces.",
    };
  }
}

export default async function ProductLayout({ children, params }: ProductLayoutProps) {
  const { id } = await params;
  let structuredData = "";

  try {
    const product = await getProduct(id);
    const image = getMetadataImage(product);
    const inStock =
      !product.trackInventory ||
      product.variants?.some((variant) => variant.active && variant.stock > 0);
    const reviews = product.reviews || [];
    structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: buildDescription(product),
      sku: product.id,
      brand: { "@type": "Brand", name: "HRUSHE" },
      ...(image ? { image: [new URL(image, "https://hrushe.in").toString()] } : {}),
      offers: {
        "@type": "Offer",
        url: `https://hrushe.in/product/${product.slug || id}`,
        priceCurrency: "INR",
        price: product.price,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      ...(reviews.length
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue:
                reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
              reviewCount: reviews.length,
            },
          }
        : {}),
    });
  } catch {
    structuredData = "";
  }

  return (
    <>
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      ) : null}
      {children}
    </>
  );
}
