import { useState, type ChangeEvent } from "react";

function fileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function mergeFiles(prev: File[], next: File[]): File[] {
    const seen = new Set(prev.map(fileKey));
    const merged = [...prev];

    for (const file of next) {
        const key = fileKey(file);
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(file);
        }
    }

    return merged;
}

/**
 * Owns one file collection (images OR files) with dedup-on-add and
 * remove-by-key. The original implementation had no way to remove a file
 * once added — that gap is fixed here.
 */
export function useFileSelection() {
    const [selected, setSelected] = useState<File[]>([]);

    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        const picked = Array.from(event.target.files ?? []);
        setSelected((prev) => mergeFiles(prev, picked));
        event.currentTarget.value = "";
    }

    function remove(file: File) {
        const key = fileKey(file);
        setSelected((prev) => prev.filter((f) => fileKey(f) !== key));
    }

    function clear() {
        setSelected([]);
    }

    return { files: selected, onSelect: handleSelect, onRemove: remove, clear, fileKey };
}