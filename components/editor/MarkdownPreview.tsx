"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
};

export default function MarkdownPreview({ content }: Props) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/75 prose-strong:text-white prose-code:text-amber-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}