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
    <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
      <h3 className="font-display text-sm font-semibold text-fg">
        Draft snapshot
      </h3>

      <div className="mt-4 rounded-[1.5rem] border border-border bg-surface p-4">
        <p className="break-words text-xs uppercase tracking-[0.2em] text-fg-dim">
          {contentType} • {visibility}
        </p>
        <h4 className="mt-3 break-words text-xl font-semibold text-fg">
          {title || "Untitled draft"}
        </h4>
        <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-fg-dim">
          {body.trim() ||
            excerpt.trim() ||
            "Your draft summary will appear here."}
        </p>
      </div>
    </div>
  );
}
