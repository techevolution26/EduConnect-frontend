import { X } from "lucide-react";

export function FileDropField({
    label,
    helperText,
    accept,
    files,
    onSelect,
    onRemove,
    fileKey,
    disabled,
}: {
    label: string;
    helperText: string;
    accept?: string;
    files: File[];
    onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (file: File) => void;
    fileKey: (file: File) => string;
    /** Gates the field — used by edit mode when content.status disallows editing. */
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block">
                <span className="text-sm text-white/70">{label}</span>
                <input
                    type="file"
                    accept={accept}
                    multiple
                    onChange={onSelect}
                    disabled={disabled}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black disabled:opacity-60"
                />
                <p className="mt-2 text-xs text-white/35">{helperText}</p>
            </label>

            {files.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                    {files.map((file) => (
                        <li
                            key={fileKey(file)}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                        >
                            <span className="min-w-0 truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(file)}
                                disabled={disabled}
                                aria-label={`Remove ${file.name}`}
                                className="shrink-0 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}