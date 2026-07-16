export default function LoadingState({
    label = "Loading...",
}: {
    label?: string;
}) {
    return (
        <div className="rounded-[2rem] border border-border bg-surface p-8 text-center">
            <p className="text-sm text-fg-dim">{label}</p>
        </div>
    );
}