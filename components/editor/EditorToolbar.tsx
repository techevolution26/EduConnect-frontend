"use client";

import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  Pilcrow,
  Quote,
  SeparatorHorizontal,
} from "lucide-react";

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function EditorToolbar({
  textareaRef,
  value,
  onChange,
  disabled,
}: Props) {
  function applyChange(nextValue: string, cursor?: number) {
    onChange(nextValue);

    if (typeof cursor !== "number") return;

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertAtCursor(prefix: string, suffix = "") {
    const textarea = textareaRef.current;

    if (!textarea) {
      applyChange(`${value}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    const nextValue =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);

    const cursor = start + prefix.length + selected.length + suffix.length;
    applyChange(nextValue, cursor);
  }

  function insertLine(prefix: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      applyChange(`${value}\n${prefix}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const nextValue = value.slice(0, start) + prefix + value.slice(start);
    const cursor = start + prefix.length;

    applyChange(nextValue, cursor);
  }

  function insertLink() {
    const url = window.prompt("Paste the link URL");
    if (!url) return;

    const label = window.prompt("Link label", "read more") || "read more";
    insertAtCursor(`[${label}](${url})`);
  }

  const buttonClass =
    "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} onClick={() => insertLine("# ")} className={buttonClass}>
        <Heading1 className="h-3.5 w-3.5" />
        H1
      </button>

      <button type="button" disabled={disabled} onClick={() => insertLine("## ")} className={buttonClass}>
        <Heading2 className="h-3.5 w-3.5" />
        H2
      </button>

      <button type="button" disabled={disabled} onClick={() => insertAtCursor("**", "**")} className={buttonClass}>
        <Bold className="h-3.5 w-3.5" />
        Bold
      </button>

      <button type="button" disabled={disabled} onClick={() => insertAtCursor("_", "_")} className={buttonClass}>
        <Italic className="h-3.5 w-3.5" />
        Italic
      </button>

      <button type="button" disabled={disabled} onClick={() => insertLine("> ")} className={buttonClass}>
        <Quote className="h-3.5 w-3.5" />
        Quote
      </button>

      <button type="button" disabled={disabled} onClick={() => insertLine("- ")} className={buttonClass}>
        <List className="h-3.5 w-3.5" />
        Bullet
      </button>

      <button type="button" disabled={disabled} onClick={() => insertAtCursor("\n---\n")} className={buttonClass}>
        <SeparatorHorizontal className="h-3.5 w-3.5" />
        Divider
      </button>

      <button type="button" disabled={disabled} onClick={insertLink} className={buttonClass}>
        <Link2 className="h-3.5 w-3.5" />
        Link
      </button>

      <button type="button" disabled={disabled} onClick={() => insertAtCursor("`", "`")} className={buttonClass}>
        <Code2 className="h-3.5 w-3.5" />
        Code
      </button>

      <button type="button" disabled={disabled} onClick={() => insertAtCursor("\n")} className={buttonClass}>
        <Pilcrow className="h-3.5 w-3.5" />
        Line
      </button>
    </div>
  );
}