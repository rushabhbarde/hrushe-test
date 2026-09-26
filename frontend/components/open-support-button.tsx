"use client";

/** Opens the HRUSHE help panel (the support chatbot listens for this event). */
export function OpenSupportButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("hrushe:open-support"))} className={className}>
      {children}
    </button>
  );
}
