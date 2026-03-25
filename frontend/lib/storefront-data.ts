import type { Product } from "@/lib/catalog";

export type HomepageBanner = {
  announcementText: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageUrl: string;
};

export const defaultProducts: Product[] = [
  {
    id: "coffee-oversized-tee",
    name: "Coffee Oversized Tee",
    slug: "coffee-oversized-tee",
    description:
      "Soft heavyweight cotton with a loose silhouette built for easy layering and all-day wear.",
    price: 899,
    compareAtPrice: 1199,
    category: "Oversized",
    colors: ["Coffee", "Bone"],
    sizes: ["S", "M", "L", "XL"],
    imageLabel: "Soft drape / heavyweight feel",
    accent: "#2d2d2d",
    featured: true,
    newArrival: true,
    images: [],
    reviews: [
      {
        reviewerName: "Aarav",
        quote:
          "The fit feels premium without trying too hard. It looks clean, sits well, and works every day.",
        rating: 5,
      },
    ],
  },
  {
    id: "stonewide-cargo",
    name: "Stone Wide Cargo",
    slug: "stone-wide-cargo",
    description:
      "Relaxed utility trousers with deep pockets, fluid volume, and a clean premium finish.",
    price: 1699,
    compareAtPrice: 2199,
    category: "Essential",
    colors: ["Stone", "Ink"],
    sizes: ["28", "30", "32", "34"],
    imageLabel: "Utility tailored for streetwear",
    accent: "#c8c7c2",
    featured: true,
    images: [],
  },
  {
    id: "midnight-studio-shirt",
    name: "Midnight Studio Shirt",
    slug: "midnight-studio-shirt",
    description:
      "A polished camp-collar shirt designed for evenings, shoots, and understated statement dressing.",
    price: 1399,
    compareAtPrice: 1799,
    category: "Shirts",
    colors: ["Midnight", "Slate"],
    sizes: ["S", "M", "L", "XL"],
    imageLabel: "Refined night-out layering",
    accent: "#14161b",
    featured: true,
    newArrival: true,
    images: [],
  },
  {
    id: "sand-structured-jacket",
    name: "Sand Structured Jacket",
    slug: "sand-structured-jacket",
    description:
      "Minimal outerwear with a crisp profile, tonal hardware, and a luxury everyday attitude.",
    price: 2399,
    compareAtPrice: 2999,
    category: "Outerwear",
    colors: ["Sand", "Olive"],
    sizes: ["M", "L", "XL"],
    imageLabel: "A sharp layer for seasonal drops",
    accent: "#8b8c87",
    images: [],
  },
  {
    id: "washed-black-graphic-tee",
    name: "Washed Black Graphic Tee",
    slug: "washed-black-graphic-tee",
    description:
      "Boxy unisex tee with a faded wash, dense cotton handfeel, and a front-back graphic layout made for standout casual fits.",
    price: 1099,
    compareAtPrice: 1499,
    category: "Graphic Tees",
    colors: ["Black", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
    imageLabel: "Washed finish / front-back graphic",
    accent: "#202020",
    featured: true,
    newArrival: true,
    images: [],
    reviews: [
      {
        reviewerName: "Riya",
        quote:
          "What stood out first was the fabric. Soft, structured, and comfortable enough to repeat all week.",
        rating: 5,
      },
    ],
  },
  {
    id: "offwhite-essential-tee",
    name: "Off White Essential Tee",
    slug: "off-white-essential-tee",
    description:
      "Clean everyday staple with a smooth premium knit, balanced oversized fit, and versatile neutral tone for repeat wear.",
    price: 799,
    compareAtPrice: 999,
    category: "Essential",
    colors: ["Off White", "Stone"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    imageLabel: "Minimal staple / premium everyday weight",
    accent: "#ded8cc",
    featured: true,
    images: [],
  },
  {
    id: "forest-relaxed-shirt",
    name: "Forest Relaxed Shirt",
    slug: "forest-relaxed-shirt",
    description:
      "Relaxed overshirt with a soft drape, subtle texture, and versatile layering silhouette for transitional styling.",
    price: 1599,
    compareAtPrice: 1999,
    category: "Shirts",
    colors: ["Forest", "Stone"],
    sizes: ["M", "L", "XL"],
    imageLabel: "Layering piece for elevated casual dressing",
    accent: "#5d6956",
    newArrival: true,
    images: [],
  },
  {
    id: "ash-cropped-hoodie",
    name: "Ash Cropped Hoodie",
    slug: "ash-cropped-hoodie",
    description:
      "Modern relaxed hoodie with a slightly cropped body, brushed interior, and refined streetwear proportions.",
    price: 1899,
    compareAtPrice: 2399,
    category: "Outerwear",
    colors: ["Ash", "Black"],
    sizes: ["S", "M", "L", "XL"],
    imageLabel: "Soft interior / contemporary silhouette",
    accent: "#8f9195",
    featured: true,
    images: [],
    reviews: [
      {
        reviewerName: "Karan",
        quote:
          "Minimal styling, strong quality, and no unnecessary noise. That is exactly why I would buy again.",
        rating: 5,
      },
    ],
  },
];

export const defaultHomepageBanner: HomepageBanner = {
  announcementText: "FREE SHIPPING ON SELECTED STYLES",
  eyebrow: "New season, everyday essentials",
  title: "Elevated basics for everyday dressing.",
  description:
    "Discover modern silhouettes, premium fabrics, and versatile staples designed to feel effortless every day.",
  primaryCtaLabel: "Shop the drop",
  primaryCtaHref: "/shop",
  secondaryCtaLabel: "View collection",
  secondaryCtaHref: "/shop",
  imageUrl: "/uploads/banners/banner1.png",
};
