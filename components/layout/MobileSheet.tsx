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

      <div className="fixed inset-x-0 bottom-[76px] z-50 mx-3 overflow-hidden rounded-3xl border border-border bg-ink/95 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-fg">{title}</p>
            {description ? (
              <p className="text-xs text-fg-dim">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-fg-dim transition hover:bg-surface-2 hover:text-fg"
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
