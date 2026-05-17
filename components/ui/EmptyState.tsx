export default function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
        </div>
    );
}