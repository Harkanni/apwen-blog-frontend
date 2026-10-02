'use client';

import { useEditorState, type Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Highlighter, Baseline, Link2, List, ListOrdered, ListChecks, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon, Plus, ChevronDown, Code, Subscript, Superscript, RemoveFormatting,
  Type, Check, Trash2, Rows3, Columns3, TableCellsMerge,
} from 'lucide-react';
import { Sheet, Switch, useIsDesktop } from '@/components/ui/Sheet';
import { BLOCK_ITEMS } from './blockItems';
import { cn } from '@/lib/format';

export const HIGHLIGHTS = [
  { name: 'Gold', value: '#fdf1dc' },
  { name: 'Lilac', value: '#ece3f7' },
  { name: 'Mint', value: '#e5f5ec' },
  { name: 'Rose', value: '#fdecef' },
  { name: 'Sky', value: '#e3f0fb' },
];
export const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'APWEN purple', value: '#6b2fa3' },
  { name: 'Deep purple', value: '#4e1c80' },
  { name: 'Gold', value: '#b87412' },
  { name: 'Green', value: '#23855b' },
  { name: 'Red', value: '#c2334d' },
  { name: 'Grey', value: '#7d7090' },
];

function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      sub: e.isActive('subscript'),
      sup: e.isActive('superscript'),
      link: e.isActive('link'),
      highlight: e.isActive('highlight'),
      color: (e.getAttributes('textStyle').color as string) || '',
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      table: e.isActive('table'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      h4: e.isActive('heading', { level: 4 }),
      align: (['center', 'right', 'justify'].find((a) => e.isActive({ textAlign: a })) || 'left') as string,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
}

export function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
  className,
  shortcut,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className={cn(
        'grid h-10 min-w-10 shrink-0 place-items-center rounded-[12px] px-2 text-ink-soft transition-[background-color,color,transform] duration-150 active:scale-90 disabled:opacity-35',
        active ? 'bg-iris text-white' : 'hover:bg-mist hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-6 w-px shrink-0 bg-ink/10" aria-hidden />;

/** Popover on desktop, bottom sheet on phones. */
function ToolPanel({ open, onOpenChange, title, anchor, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; anchor: React.ReactNode; children: React.ReactNode }) {
  const desktop = useIsDesktop();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !desktop) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onOpenChange(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, desktop, onOpenChange]);

  return (
    <div className="relative shrink-0" ref={ref}>
      {anchor}
      {desktop ? (
        <AnimatePresence>
          {open && (
            <motion.div
              className="absolute left-0 top-full z-40 mt-2 min-w-[220px] rounded-[var(--radius-md)] bg-white p-2 shadow-[var(--shadow-float)]"
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange} title={title}>
          <div className="pb-3">{children}</div>
        </Sheet>
      )}
    </div>
  );
}

function MenuRow({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left max-md:min-h-13 max-md:text-[1.02rem]', active ? 'bg-mist text-iris-deep' : 'text-ink hover:bg-mist')}
    >
      {children}
      {active && <Check className="ml-auto size-4 text-iris" />}
    </button>
  );
}

export function Toolbar({ editor, onPickImage, onLink, variant }: { editor: Editor; onPickImage: () => void; onLink: () => void; variant: 'top' | 'bottom' }) {
  const s = useToolbarState(editor);
  const [panel, setPanel] = useState<null | 'style' | 'color' | 'align' | 'insert' | 'more' | 'table'>(null);
  const toggle = (p: typeof panel) => setPanel((cur) => (cur === p ? null : p));
  const close = () => setPanel(null);
  const c = () => editor.chain().focus();

  const styleLabel = s.h2 ? 'Heading' : s.h3 ? 'Subheading' : s.h4 ? 'Small heading' : 'Text';
  const AlignIcon = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[s.align] || AlignLeft;
  const mobile = variant === 'bottom';

  return (
    <div className={cn('no-scrollbar flex items-center gap-0.5', mobile ? 'overflow-x-auto px-2 py-1.5' : 'flex-wrap px-1 py-1')} role="toolbar" aria-label="Formatting">
      {mobile && (
        <ToolButton label="Insert block" onClick={() => toggle('insert')} active={panel === 'insert'}>
          <Plus className="size-5" />
        </ToolButton>
      )}
      {!mobile && (
        <>
          <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={!s.canUndo} onClick={() => c().undo().run()}>
            <Undo2 className="size-[18px]" />
          </ToolButton>
          <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={!s.canRedo} onClick={() => c().redo().run()}>
            <Redo2 className="size-[18px]" />
          </ToolButton>
          <Sep />
        </>
      )}

      <ToolPanel
        open={panel === 'style'}
        onOpenChange={(v) => setPanel(v ? 'style' : null)}
        title="Text style"
        anchor={
          <ToolButton label="Text style" onClick={() => toggle('style')} className="gap-1 px-2.5 font-sans text-[0.9rem] font-[600]">
            <span className="flex items-center gap-1">
              {mobile ? <Type className="size-[18px]" /> : styleLabel}
              <ChevronDown className="size-3.5 opacity-60" />
            </span>
          </ToolButton>
        }
      >
        <MenuRow active={!s.h2 && !s.h3 && !s.h4} onClick={() => (c().setParagraph().run(), close())}>
          <span className="font-serif">Text</span>
        </MenuRow>
        <MenuRow active={s.h2} onClick={() => (c().toggleHeading({ level: 2 }).run(), close())}>
          <span className="text-[1.2rem] font-[680] tracking-[-0.02em]">Heading</span>
        </MenuRow>
        <MenuRow active={s.h3} onClick={() => (c().toggleHeading({ level: 3 }).run(), close())}>
          <span className="text-[1.05rem] font-[650]">Subheading</span>
        </MenuRow>
        <MenuRow active={s.h4} onClick={() => (c().toggleHeading({ level: 4 }).run(), close())}>
          <span className="text-[0.95rem] font-[650]">Small heading</span>
        </MenuRow>
      </ToolPanel>

      <ToolButton label="Bold" shortcut="Ctrl+B" active={s.bold} onClick={() => c().toggleBold().run()}>
        <Bold className="size-[18px]" strokeWidth={2.5} />
      </ToolButton>
      <ToolButton label="Italic" shortcut="Ctrl+I" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <Italic className="size-[18px]" />
      </ToolButton>
      <ToolButton label="Underline" shortcut="Ctrl+U" active={s.underline} onClick={() => c().toggleUnderline().run()}>
        <Underline className="size-[18px]" />
      </ToolButton>
      {!mobile && (
        <ToolButton label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()}>
          <Strikethrough className="size-[18px]" />
        </ToolButton>
      )}

      <ToolButton label="Link" shortcut="Ctrl+K" active={s.link} onClick={onLink}>
        <Link2 className="size-[18px]" />
      </ToolButton>

      <ToolPanel
        open={panel === 'color'}
        onOpenChange={(v) => setPanel(v ? 'color' : null)}
        title="Highlight and colour"
        anchor={
          <ToolButton label="Highlight and text colour" active={s.highlight || !!s.color} onClick={() => toggle('color')}>
            <Highlighter className="size-[18px]" />
          </ToolButton>
        }
      >
        <p className="px-1 pb-2 text-[0.8rem] font-[600] text-ink-faint">Highlight</p>
        <div className="flex flex-wrap gap-2 px-1">
          {HIGHLIGHTS.map((h) => (
            <button
              key={h.value}
              type="button"
              aria-label={`${h.name} highlight`}
              title={h.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => (c().toggleHighlight({ color: h.value }).run(), close())}
              className="size-10 rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{ background: h.value, boxShadow: editor.isActive('highlight', { color: h.value }) ? '0 0 0 2px #fff, 0 0 0 4px var(--color-iris)' : 'inset 0 0 0 1px rgb(30 15 46 / 0.08)' }}
            />
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (c().unsetHighlight().run(), close())}
            className="btn btn-ghost btn-sm h-10"
          >
            None
          </button>
        </div>
        <p className="px-1 pb-2 pt-4 text-[0.8rem] font-[600] text-ink-faint">Text colour</p>
        <div className="flex flex-wrap gap-2 px-1">
          {TEXT_COLORS.map((t) => (
            <button
              key={t.name}
              type="button"
              aria-label={t.name}
              title={t.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => (t.value ? c().setColor(t.value).run() : c().unsetColor().run(), close())}
              className="grid size-10 place-items-center rounded-full bg-mist text-[1.05rem] font-[700] transition-transform hover:scale-110 active:scale-95"
              style={{ color: t.value || 'var(--color-ink)', boxShadow: s.color === t.value ? '0 0 0 2px #fff, 0 0 0 4px var(--color-iris)' : undefined }}
            >
              A
            </button>
          ))}
        </div>
      </ToolPanel>

      <Sep />
      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <List className="size-[18px]" />
      </ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="size-[18px]" />
      </ToolButton>
      {!mobile && (
        <ToolButton label="Checklist" active={s.task} onClick={() => c().toggleTaskList().run()}>
          <ListChecks className="size-[18px]" />
        </ToolButton>
      )}
      <ToolButton label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
        <Quote className="size-[18px]" />
      </ToolButton>

      <ToolPanel
        open={panel === 'align'}
        onOpenChange={(v) => setPanel(v ? 'align' : null)}
        title="Alignment"
        anchor={
          <ToolButton label="Alignment" onClick={() => toggle('align')}>
            <AlignIcon className="size-[18px]" />
          </ToolButton>
        }
      >
        {(
          [
            ['left', 'Left', AlignLeft],
            ['center', 'Centre', AlignCenter],
            ['right', 'Right', AlignRight],
            ['justify', 'Justify', AlignJustify],
          ] as const
        ).map(([key, label, Icon]) => (
          <MenuRow key={key} active={s.align === key} onClick={() => (c().setTextAlign(key).run(), close())}>
            <Icon className="size-[18px]" /> {label}
          </MenuRow>
        ))}
      </ToolPanel>

      <Sep />
      <ToolButton label="Add image" onClick={onPickImage}>
        <ImageIcon className="size-[18px]" />
      </ToolButton>

      {!mobile && (
        <ToolPanel
          open={panel === 'insert'}
          onOpenChange={(v) => setPanel(v ? 'insert' : null)}
          title="Insert"
          anchor={
            <ToolButton label="Insert block" onClick={() => toggle('insert')} className="gap-1 px-2.5 font-sans text-[0.9rem] font-[600]">
              <span className="flex items-center gap-1">
                <Plus className="size-[18px]" /> Insert
              </span>
            </ToolButton>
          }
        >
          <InsertGrid editor={editor} onDone={close} />
        </ToolPanel>
      )}

      {s.table && (
        <ToolPanel
          open={panel === 'table'}
          onOpenChange={(v) => setPanel(v ? 'table' : null)}
          title="Table"
          anchor={
            <ToolButton label="Table options" active={panel === 'table'} onClick={() => toggle('table')} className="gap-1 px-2.5 font-sans text-[0.9rem] font-[600]">
              <span className="flex items-center gap-1">
                <TableCellsMerge className="size-[18px]" /> Table
              </span>
            </ToolButton>
          }
        >
          <MenuRow onClick={() => (c().addRowAfter().run(), close())}>
            <Rows3 className="size-[18px]" /> Add row below
          </MenuRow>
          <MenuRow onClick={() => (c().addColumnAfter().run(), close())}>
            <Columns3 className="size-[18px]" /> Add column right
          </MenuRow>
          <MenuRow onClick={() => (c().deleteRow().run(), close())}>
            <Rows3 className="size-[18px]" /> Remove this row
          </MenuRow>
          <MenuRow onClick={() => (c().deleteColumn().run(), close())}>
            <Columns3 className="size-[18px]" /> Remove this column
          </MenuRow>
          <MenuRow onClick={() => (c().toggleHeaderRow().run(), close())}>
            <TableCellsMerge className="size-[18px]" /> Toggle header row
          </MenuRow>
          <MenuRow onClick={() => (c().deleteTable().run(), close())}>
            <Trash2 className="size-[18px] text-danger" /> <span className="text-danger">Delete table</span>
          </MenuRow>
        </ToolPanel>
      )}

      <ToolPanel
        open={panel === 'more'}
        onOpenChange={(v) => setPanel(v ? 'more' : null)}
        title="More formatting"
        anchor={
          <ToolButton label="More formatting" onClick={() => toggle('more')}>
            <ChevronDown className="size-[18px]" />
          </ToolButton>
        }
      >
        {mobile && (
          <MenuRow active={s.strike} onClick={() => (c().toggleStrike().run(), close())}>
            <Strikethrough className="size-[18px]" /> Strikethrough
          </MenuRow>
        )}
        <MenuRow active={s.code} onClick={() => (c().toggleCode().run(), close())}>
          <Code className="size-[18px]" /> Inline code
        </MenuRow>
        <MenuRow active={s.sup} onClick={() => (c().toggleSuperscript().run(), close())}>
          <Superscript className="size-[18px]" /> Superscript (x²)
        </MenuRow>
        <MenuRow active={s.sub} onClick={() => (c().toggleSubscript().run(), close())}>
          <Subscript className="size-[18px]" /> Subscript (H₂O)
        </MenuRow>
        <MenuRow onClick={() => (c().unsetAllMarks().clearNodes().run(), close())}>
          <RemoveFormatting className="size-[18px]" /> Clear formatting
        </MenuRow>
        {mobile && (
          <>
            <MenuRow onClick={() => (c().undo().run(), close())}>
              <Undo2 className="size-[18px]" /> Undo
            </MenuRow>
            <MenuRow onClick={() => (c().redo().run(), close())}>
              <Redo2 className="size-[18px]" /> Redo
            </MenuRow>
          </>
        )}
      </ToolPanel>

      {mobile && (
        <Sheet open={panel === 'insert'} onOpenChange={(v) => setPanel(v ? 'insert' : null)} title="Insert">
          <InsertGrid editor={editor} onDone={close} />
        </Sheet>
      )}
    </div>
  );
}

export function InsertGrid({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 pb-2 md:w-[420px]">
      {BLOCK_ITEMS.filter((i) => i.key !== 'text').map((item) => (
        <button
          key={item.key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onDone();
            // Wait for a phone sheet to close so focus returns to the editor first.
            setTimeout(() => item.run(editor), 60);
          }}
          className="flex items-center gap-3 rounded-[12px] bg-mist/60 p-2.5 text-left transition-colors hover:bg-mist active:scale-[0.98]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-iris">
            <item.icon className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9rem] font-[600] text-ink">{item.label}</span>
            <span className="block truncate text-[0.75rem] text-ink-faint">{item.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function LinkSheet({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [newTab, setNewTab] = useState(true);
  const hadLink = useRef(false);

  useEffect(() => {
    if (!open) return;
    const attrs = editor.getAttributes('link');
    hadLink.current = !!attrs.href;
    setUrl(attrs.href || '');
    setNewTab(attrs.target ? attrs.target === '_blank' : true);
    const { from, to, empty } = editor.state.selection;
    setText(empty ? '' : editor.state.doc.textBetween(from, to, ' '));
  }, [open, editor]);

  const normalise = (v: string) => {
    const t = v.trim();
    if (!t) return '';
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(t)) return t;
    if (/^\S+@\S+\.\S+$/.test(t)) return `mailto:${t}`;
    return `https://${t}`;
  };

  const apply = () => {
    const href = normalise(url);
    if (!href) return;
    const attrs = { href, target: newTab ? '_blank' : null };
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: text.trim() || href.replace(/^https?:\/\/|mailto:/, ''), marks: [{ type: 'link', attrs }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink(attrs as any).run();
    }
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={hadLink.current ? 'Edit link' : 'Add a link'}
      footer={
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-between">
          {hadLink.current ? (
            <button
              className="btn btn-ghost text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                onOpenChange(false);
              }}
            >
              <Trash2 className="size-4" /> Remove link
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" onClick={apply} disabled={!url.trim()}>
            {hadLink.current ? 'Save link' : 'Add link'}
          </button>
        </div>
      }
    >
      <form
        className="space-y-4 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <div>
          <label className="label" htmlFor="link-url">
            Web address
          </label>
          <input id="link-url" className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="apwen.org.ng or an email address" inputMode="url" autoFocus autoCapitalize="none" autoCorrect="off" />
        </div>
        {editor.state.selection.empty && !hadLink.current && (
          <div>
            <label className="label" htmlFor="link-text">
              Text to show
            </label>
            <input id="link-text" className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Read the full report" />
          </div>
        )}
        <Switch checked={newTab} onChange={setNewTab} label="Open in a new tab" hint="Recommended for links to other websites" />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
