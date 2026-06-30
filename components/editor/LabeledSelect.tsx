export function LabeledSelect<T extends string>({
    label,
    value,
    onChange,
    options,
    emptyOption,
    disabled,
}: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; label: string }>;
    /** If provided, shows a leading empty option (e.g. "No category"). */
    emptyOption?: string;
    /** Gates the field — used by edit mode when content.status disallows editing. */
    disabled?: boolean;
}) {
    return (
        <div className="min-w-0">
            <label className="text-sm text-white/70">{label}</label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as T)}
                disabled={disabled}
                className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 disabled:opacity-60"
            >
                {emptyOption ? <option value="">{emptyOption}</option> : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}