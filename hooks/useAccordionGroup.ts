import { useEffect, useRef, useState } from "react";

/**
 * Manages a group of mutually-exclusive collapsible panels with a single
 * outside-click listener. Replaces N copies of:
 *   - useState per panel
 *   - useRef per panel
 *   - manual "close the other two" logic in every onClick
 *   - one outside-click effect with N near-identical if-blocks
 *
 * Usage:
 *   const accordion = useAccordionGroup(["title", "attachments", "settings"]);
 *   <div ref={accordion.refFor("title")}>
 *     <button onClick={() => accordion.toggle("title")}>...</button>
 *     {accordion.isOpen("title") ? <Panel /> : null}
 *   </div>
 */
export function useAccordionGroup<TKey extends string>(keys: readonly TKey[]) {
    const [openKey, setOpenKey] = useState<TKey | null>(null);
    const refs = useRef(new Map<TKey, HTMLDivElement | null>());

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent | TouchEvent) {
            if (!openKey) return;
            const target = event.target as Node;
            const activePanelEl = refs.current.get(openKey);

            if (activePanelEl && !activePanelEl.contains(target)) {
                setOpenKey(null);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [openKey]);

    return {
        isOpen: (key: TKey) => openKey === key,
        toggle: (key: TKey) => setOpenKey((current) => (current === key ? null : key)),
        close: () => setOpenKey(null),
        /** Attach to the wrapping div of each panel so outside-click detection works. */
        refFor: (key: TKey) => (el: HTMLDivElement | null) => {
            refs.current.set(key, el);
        },
    };
}