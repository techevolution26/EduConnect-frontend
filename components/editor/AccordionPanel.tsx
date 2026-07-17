import { ChevronDown } from "lucide-react";
import type { ReactNode, RefObject } from "react";

export function AccordionPanel({
  panelRef,
  title,
  isOpen,
  onToggle,
  children,
  variant = "nested",
}: {
  panelRef: RefObject<HTMLDivElement> | ((el: HTMLDivElement | null) => void);
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** "nested" = small section inside a card. "primary" = top-level card heading. */
  variant?: "nested" | "primary";
})  {
  return (
    <div
      ref={panelRef as RefObject<HTMLDivElement>}
      className={
        variant === "primary"
          ? "rounded-[2rem] border border-border bg-surface-2 p-5"
          : "rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5"
      }
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <span className={variant === "primary" ? "text-lg font-semibold text-fg" : "text-sm font-semibold text-fg"}>
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-fg-dim transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? <div className="mt-4 grid gap-4">{children}</div> : null}
    </div>
  );
}