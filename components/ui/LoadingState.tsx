export default function LoadingState({
    label = "Loading...",
}: {
    label?: string;
}) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-sm text-white/50">{label}</p>
        </div>
    );
}