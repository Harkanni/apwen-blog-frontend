'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState, type Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Link2, Highlighter, Heading2, Quote } from 'lucide-react';
import { ToolButton } from './Toolbar';

/** Floating formatting bar that appears over selected text (desktop and tablets).
 *  Phones use the toolbar pinned above the keyboard instead, so the native
 *  selection handles aren't covered. */
export function SelectionBubble({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      link: e.isActive('link'),
      highlight: e.isActive('highlight'),
      h2: e.isActive('heading', { level: 2 }),
      quote: e.isActive('blockquote'),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 10 }}
      shouldShow={({ editor: e, state, from, to }) => {
        if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return false;
        if (from === to || !e.isEditable) return false;
        if (e.isActive('image') || e.isActive('youtube')) return false;
        const text = state.doc.textBetween(from, to, ' ');
        return text.trim().length > 0;
      }}
    >
      <div className="flex items-center gap-0.5 rounded-[14px] bg-ink p-1 shadow-[var(--shadow-float)] [&_button]:text-white/80 [&_button:hover]:bg-white/12 [&_button:hover]:text-white [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-ink">
        <ToolButton label="Heading" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}>
          <Bold className="size-[18px]" strokeWidth={2.5} />
        </ToolButton>
        <ToolButton label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}>
          <Italic className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}>
          <Underline className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Highlight" active={s.highlight} onClick={() => c().toggleHighlight({ color: '#fdf1dc' }).run()}>
          <Highlighter className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
          <Quote className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Link" active={s.link} onClick={onLink}>
          <Link2 className="size-[18px]" />
        </ToolButton>
      </div>
    </BubbleMenu>
  );
}
