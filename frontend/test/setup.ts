import React from "react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    unoptimized,
    ...props
  }: {
    src: string | { src?: string };
    alt: string;
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) =>
    React.createElement("img", {
      ...props,
      src: typeof src === "string" ? src : src?.src || "",
      alt,
      "data-fill": fill ? "true" : undefined,
      "data-priority": priority ? "true" : undefined,
      "data-unoptimized": unoptimized ? "true" : undefined,
    }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { ...props, href }, children),
}));
