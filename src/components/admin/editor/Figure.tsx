'use client';

import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { RectangleHorizontal, Columns2, Maximize2, Trash2, Replace, Loader2, TextCursorInput } from 'lucide-react';
import { cn } from '@/lib/format';

// ---- Upload progress store (kept outside the document so it doesn't pollute undo history)
const progress = new Map<string, number>();
const listeners = new Set<() => void>();
export const uploadProgress = {
  set(id: string, pct: number | null) {
    if (pct === null) progress.delete(id);
    else progress.set(id, pct);
    listeners.forEach((l) => l());
  },
};
function useUploadProgress(id: string | null) {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (id ? (progress.get(id) ?? null) : null),
    () => null,
  );
}

const LAYOUTS = [
  { key: 'normal', label: 'Text width', icon: RectangleHorizontal },
  { key: 'wide', label: 'Wide', icon: Columns2 },
  { key: 'full', label: 'Full width', icon: Maximize2 },
] as const;

function FigureView({ node, updateAttributes, deleteNode, selected, editor, getPos }: NodeViewProps) {
  const { src, alt, caption, layout, uploadId } = node.attrs as Record<string, any>;
  const pct = useUploadProgress(uploadId);
  const uploading = typeof src === 'string' && src.startsWith('blob:');
  const [editingAlt, setEditingAlt] = useState(false);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const editable = editor.isEditable;

  useEffect(() => {
    const el = captionRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [caption]);

  const replace = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    window.dispatchEvent(new CustomEvent('apwen:pick-image', { detail: { replacePos: pos } }));
  };

  return (
    <NodeViewWrapper as="figure" data-layout={layout || 'normal'} className="relative" data-drag-handle>
      <div className={cn('relative transition-shadow duration-200', selected && editable && 'rounded-[var(--radius-md)] shadow-[0_0_0_3px_var(--color-iris)] max-md:rounded-none')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt || ''} draggable={false} className={cn(uploading && 'opacity-60 blur-[1px]')} />
        {uploading && (
          <div className="absolute inset-0 grid place-items-center" contentEditable={false}>
            <div className="flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 font-sans text-sm text-white backdrop-blur">
              <Loader2 className="size-4 animate-spin" /> {pct !== null ? `Uploading ${pct}%` : 'Uploading'}
            </div>
          </div>
        )}
        {selected && editable && !uploading && (
          <div
            contentEditable={false}
            className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-ink/90 p-1 font-sans text-white shadow-[var(--shadow-float)] backdrop-blur"
          >
            {LAYOUTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={(layout || 'normal') === key}
                onClick={() => updateAttributes({ layout: key })}
                className={cn('grid size-9 place-items-center rounded-full transition-colors', (layout || 'normal') === key ? 'bg-white text-ink' : 'hover:bg-white/15')}
              >
                <Icon className="size-[17px]" />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-white/25" />
            <button type="button" title="Describe image" aria-label="Describe image for screen readers" onClick={() => setEditingAlt((v) => !v)} className="grid size-9 place-items-center rounded-full hover:bg-white/15">
              <TextCursorInput className="size-[17px]" />
            </button>
            <button type="button" title="Replace image" aria-label="Replace image" onClick={replace} className="grid size-9 place-items-center rounded-full hover:bg-white/15">
              <Replace className="size-[17px]" />
            </button>
            <button type="button" title="Remove image" aria-label="Remove image" onClick={deleteNode} className="grid size-9 place-items-center rounded-full text-[#ffb3c0] hover:bg-white/15">
              <Trash2 className="size-[17px]" />
            </button>
          </div>
        )}
      </div>

      {editable && (editingAlt || (selected && !alt)) && !uploading && (
        <div contentEditable={false} className="mx-auto mt-2 flex max-w-[680px] items-center gap-2 font-sans max-md:px-5">
          <input
            value={alt || ''}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            placeholder="Describe the image for people who can’t see it"
            className="field min-h-10 py-2 text-[0.88rem]"
            aria-label="Image description"
          />
        </div>
      )}

      {editable ? (
        <textarea
          ref={captionRef}
          contentEditable={false}
          rows={1}
          value={caption || ''}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const pos = typeof getPos === 'function' ? getPos() : null;
              if (pos != null) editor.chain().insertContentAt(pos + node.nodeSize, { type: 'paragraph' }).focus(pos + node.nodeSize + 1).run();
            }
          }}
          placeholder="Add a caption (optional)"
          aria-label="Image caption"
          className="mt-2.5 block w-full resize-none overflow-hidden bg-transparent text-center font-sans text-[0.82rem] leading-relaxed text-ink-faint outline-none placeholder:text-ink-faint/55 max-md:px-5"
        />
      ) : (
        caption && <figcaption>{caption}</figcaption>
      )}
    </NodeViewWrapper>
  );
}

/** Block image with caption, layout (text width / wide / full) and alt text. */
export const Figure = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: '' },
      layout: { default: 'normal' },
      uploadId: { default: null, rendered: false },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const { caption, layout, ...img } = HTMLAttributes;
    return ['figure', { 'data-layout': node.attrs.layout || 'normal' }, ['img', mergeAttributes(img)], ['figcaption', {}, node.attrs.caption || '']];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
}).configure({ inline: false, allowBase64: false });
