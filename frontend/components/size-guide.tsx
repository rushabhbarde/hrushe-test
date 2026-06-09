"use client";

const oversizedTeeSizeRows = [
  { size: "S", chest: "40", length: "27", shoulder: "18", sleeve: "8.5" },
  { size: "M", chest: "42", length: "28", shoulder: "19", sleeve: "9" },
  { size: "L", chest: "44", length: "29", shoulder: "20", sleeve: "9.5" },
  { size: "XL", chest: "46", length: "30", shoulder: "21", sleeve: "10" },
  { size: "XXL", chest: "48", length: "31", shoulder: "22", sleeve: "10.5" },
];

export function SizeGuideTable() {
  return (
    <div className="overflow-x-auto border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.58)]">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <caption className="sr-only">Oversized t-shirt size guide in inches</caption>
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
          {oversizedTeeSizeRows.map((row) => (
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
}: {
  open: boolean;
  onClose: () => void;
}) {
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
      <section className="absolute inset-x-3 bottom-3 max-h-[86vh] overflow-y-auto border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_24px_70px_rgba(17,17,17,0.18)] sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(680px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]">
              Size guide
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.05em]">
              Oversized t-shirt fit
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Measurements are garment measurements in inches. Choose your usual size for a relaxed oversized shape, or size down for a cleaner fall.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border)] text-xl"
            aria-label="Close size guide"
          >
            ×
          </button>
        </div>
        <div className="mt-6">
          <SizeGuideTable />
        </div>
      </section>
    </div>
  );
}
