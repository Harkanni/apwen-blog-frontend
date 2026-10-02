'use client';

import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BLOCK_ITEMS, filterItems, type BlockItem } from './blockItems';
import { cn } from '@/lib/format';

type ListHandle = { onKeyDown: (p: SuggestionKeyDownProps) => boolean };

const SlashList = forwardRef<ListHandle, SuggestionProps<BlockItem>>(function SlashList(props, ref) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setActive(0), [props.items]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!props.items.length) return false;
      if (event.key === 'ArrowDown') {
        setActive((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setActive((i) => (i - 1 + props.items.length) % props.items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        props.command(props.items[active]);
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      ref={listRef}
      className="max-h-[min(340px,45dvh)] w-[min(300px,calc(100vw-24px))] overflow-y-auto overscroll-contain rounded-[var(--radius-md)] bg-white p-1.5 font-sans shadow-[var(--shadow-float)]"
      role="listbox"
      aria-label="Insert a block"
    >
      {props.items.length === 0 ? (
        <p className="px-3 py-2.5 text-sm text-ink-faint">No matching blocks</p>
      ) : (
        props.items.map((item, i) => (
          <button
            key={item.key}
            data-index={i}
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              props.command(item);
            }}
            className={cn('flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left', i === active ? 'bg-mist' : '')}
          >
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', i === active ? 'bg-white text-iris' : 'bg-mist text-ink-soft')}>
              <item.icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.92rem] font-[600] text-ink">{item.label}</span>
              <span className="block truncate text-[0.78rem] text-ink-faint">{item.hint}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
});

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<BlockItem>({
        editor: this.editor,
        pluginKey: new PluginKey('slashCommand'),
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }) => filterItems(query).slice(0, BLOCK_ITEMS.length),
        allow: ({ state, range }) => {
          // Only offer blocks in normal text, not inside code or table cells.
          const $from = state.doc.resolve(range.from);
          return !['codeBlock', 'tableCell', 'tableHeader', 'pullQuote'].includes($from.parent.type.name);
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let component: ReactRenderer<ListHandle, SuggestionProps<BlockItem>> | null = null;
          let el: HTMLElement | null = null;

          const place = (props: SuggestionProps<BlockItem>) => {
            const rect = props.clientRect?.();
            if (!rect || !el) return;
            const virtual = { getBoundingClientRect: () => rect };
            computePosition(virtual, el, {
              placement: 'bottom-start',
              strategy: 'fixed',
              middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 })],
            }).then(({ x, y }) => {
              if (el) Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
            });
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashList, { props, editor: props.editor });
              el = document.createElement('div');
              el.style.position = 'fixed';
              el.style.zIndex = '60';
              el.className = 'animate-fade';
              el.appendChild(component.element);
              document.body.appendChild(el);
              place(props);
            },
            onUpdate: (props) => {
              component?.updateProps(props);
              place(props);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                el?.remove();
                el = null;
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              el?.remove();
              component?.destroy();
              el = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
