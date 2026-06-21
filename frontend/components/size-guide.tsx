"use client";

import type { ProductSizeMeasurement } from "@/lib/catalog";
import { resolveProductSizeGuide } from "@/lib/size-guide";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

export function SizeGuideTable({ rows }: { rows?: ProductSizeMeasurement[] }) {
  const resolvedRows = resolveProductSizeGuide(rows);

  if (resolvedRows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.58)]">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <caption className="sr-only">Garment size guide in inches</caption>
        <thead>
          <tr className="border-b border-[rgba(17,17,17,0.08)] text-[0.66rem] uppercase tracking-[0.16em] text-[var(--muted)]">
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Chest</th>
            <th className="px-4 py-3 font-medium">Length</th>
            <th className="px-4 py-3 font-medium">Shoulder</th>
            <th className="px-4 py-3 font-medium">Sleeve</th>
          </tr>
        </thead>
        <tbody>
          {resolvedRows.map((row) => (
            <tr key={row.size} className="border-b border-[rgba(17,17,17,0.06)] last:border-0">
              <td className="px-4 py-3 font-semibold">{row.size}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{row.chest}&quot;</td>
              <td className="px-4 py-3 text-[var(--muted)]">{row.length}&quot;</td>
              <td className="px-4 py-3 text-[var(--muted)]">{row.shoulder}&quot;</td>
              <td className="px-4 py-3 text-[var(--muted)]">{row.sleeve}&quot;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SizeGuideModal({
  open,
  onClose,
  rows,
  title = "Oversized t-shirt fit",
}: {
  open: boolean;
  onClose: () => void;
  rows?: ProductSizeMeasurement[];
  title?: string;
}) {
  const { dialogRef, initialFocusRef } = useDialogAccessibility(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close size guide"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="absolute inset-x-3 bottom-3 max-h-[86vh] overflow-y-auto border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_24px_70px_rgba(17,17,17,0.18)] sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(680px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]">
              Size guide
            </p>
            <h2 id="size-guide-title" className="mt-2 text-2xl font-semibold uppercase tracking-[-0.05em]">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Measurements are garment measurements in inches. Compare them with a piece you already own for the clearest fit reference.
            </p>
          </div>
          <button
            type="button"
            ref={initialFocusRef}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border)] text-xl"
            aria-label="Close size guide"
          >
            ×
          </button>
        </div>
        <div className="mt-6">
          <SizeGuideTable rows={rows} />
        </div>
      </section>
    </div>
  );
}
