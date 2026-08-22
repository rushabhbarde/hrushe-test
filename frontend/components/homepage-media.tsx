import Image from "next/image";
import {
  resolveHomepageMediaSource,
  type HomepageMediaIssue,
} from "@/lib/homepage-media";
import {
  HRUSHE_SYMBOL_LOGO_DIMENSIONS,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";
import type { MediaAsset } from "@/lib/admin-workspace";

export function HomepageMediaFrame({
  src,
  mobileSrc,
  fallbackSrc,
  alt,
  sizes,
  priority = false,
  className,
  objectPosition,
  mediaLibrary,
}: {
  src?: string;
  mobileSrc?: string;
  fallbackSrc?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className: string;
  objectPosition?: string;
  mediaLibrary?: readonly MediaAsset[];
}) {
  const resolved = resolveHomepageMediaSource({
    src,
    mobileSrc,
    fallbackSrc,
    mediaLibrary,
  });
  const style = { objectPosition: objectPosition || "center" };

  if (!resolved) {
    return (
      <div
        aria-hidden="true"
        data-homepage-media-fallback
        className={`flex h-full w-full items-center justify-center bg-[var(--foreground)] ${className}`}
      >
        <Image
          src={HRUSHE_SYMBOL_LOGO_PATH}
          alt=""
          width={HRUSHE_SYMBOL_LOGO_DIMENSIONS.width}
          height={HRUSHE_SYMBOL_LOGO_DIMENSIONS.height}
          className="h-10 w-auto opacity-30"
        />
      </div>
    );
  }

  if (resolved.mobileSrc !== resolved.desktopSrc) {
    return (
      <>
        <Image
          src={resolved.mobileSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`${className} sm:hidden`}
          style={style}
        />
        <Image
          src={resolved.desktopSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`${className} hidden sm:block`}
          style={style}
        />
      </>
    );
  }

  return (
    <Image
      src={resolved.desktopSrc}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      style={style}
    />
  );
}

const reasonLabels: Record<HomepageMediaIssue["reason"], string> = {
  missing: "Missing required media",
  invalid: "Invalid media URL",
  deleted: "Media no longer exists in the library",
};

export function AdminMissingMediaWarning({ issues }: { issues: readonly HomepageMediaIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="border border-[color:color-mix(in_srgb,var(--danger)_38%,var(--foreground)_10%)] bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface)_92%)] px-4 py-4"
    >
      <p className="text-sm font-semibold text-[var(--danger)]">Homepage media needs attention.</p>
      <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
        {issues.slice(0, 6).map((issue) => (
          <li key={issue.id}>
            {reasonLabels[issue.reason]}: {issue.label}
          </li>
        ))}
      </ul>
      {issues.length > 6 ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          {issues.length - 6} more section or card media item{issues.length - 6 === 1 ? "" : "s"} need review.
        </p>
      ) : null}
    </div>
  );
}
