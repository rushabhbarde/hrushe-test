import type { Metadata } from "next";
import type { Product } from "@/lib/catalog";

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

export async function generateMetadata({
  params,
}: Omit<ProductLayoutProps, "children">): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(`${BACKEND_API_URL}/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error("Product metadata request failed");
    }

    const product = (await response.json()) as Product;
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

export default function ProductLayout({ children }: ProductLayoutProps) {
  return children;
}
