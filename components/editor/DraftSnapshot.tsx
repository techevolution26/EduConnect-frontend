export function DraftSnapshot({
    contentType,
    visibility,
    title,
    body,
    excerpt,
}: {
    contentType: string;
    visibility: string;
    title: string;
    body: string;
    excerpt: string;
}) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold text-white">Draft snapshot</h3>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="break-words text-xs uppercase tracking-[0.2em] text-white/35">
                    {contentType} • {visibility}
                </p>
                <h4 className="mt-3 break-words text-xl font-semibold text-white">
                    {title || "Untitled draft"}
                </h4>
                <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/65">
                    {body.trim() || excerpt.trim() || "Your draft summary will appear here."}
                </p>
            </div>
        </div>
    );
}