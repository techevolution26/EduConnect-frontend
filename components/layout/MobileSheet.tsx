"use client";

import { ReactNode, useEffect } from "react";

export function MobileSheet({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close mobile sheet"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/45 md:hidden"
      />

      <div className="fixed inset-x-0 bottom-[76px] z-50 mx-3 overflow-hidden rounded-3xl border border-white/10 bg-[#09090b]/95 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {description ? (
              <p className="text-xs text-white/45">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className={`max-h-[60vh] overflow-y-auto p-3 ${className}`.trim()}>
          {children}
        </div>
      </div>
    </>
  );
}
