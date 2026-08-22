import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AdminMissingMediaWarning,
  HomepageMediaFrame,
} from "@/components/homepage-media";

describe("HomepageMediaFrame", () => {
  it("renders a valid image", () => {
    render(
      <div className="relative">
        <HomepageMediaFrame
          src="/uploads/home/hero.png"
          alt="HRUSHE hero"
          sizes="100vw"
          className="object-cover"
        />
      </div>
    );

    expect(screen.getByAltText("HRUSHE hero")).toHaveAttribute("src", "/uploads/home/hero.png");
  });

  it("renders a deliberate fallback instead of an invalid image", () => {
    const { container } = render(
      <HomepageMediaFrame
        src="/uploads/banners/banner1.png"
        alt="Broken default"
        sizes="100vw"
        className="object-cover"
      />
    );

    expect(container.querySelector("[data-homepage-media-fallback]")).toBeInTheDocument();
    expect(screen.queryByAltText("Broken default")).not.toBeInTheDocument();
  });
});

describe("AdminMissingMediaWarning", () => {
  it("shows admin warnings for missing media", () => {
    render(
      <AdminMissingMediaWarning
        issues={[
          {
            id: "section:image",
            label: "Women hero",
            field: "section.image",
            reason: "missing",
          },
        ]}
      />
    );

    expect(screen.getByText("Homepage media needs attention.")).toBeInTheDocument();
    expect(screen.getByText(/Missing required media: Women hero/)).toBeInTheDocument();
  });
});
