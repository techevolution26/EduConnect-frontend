export default function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[2rem] border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-lg text-fg">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-fg-dim">{description}</p>
        </div>
    );
}