'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import { Info, Lightbulb, TriangleAlert, CircleCheck } from 'lucide-react';

const VARIANTS = ['info', 'tip', 'warning', 'success'] as const;
type Variant = (typeof VARIANTS)[number];
const ICON = { info: Info, tip: Lightbulb, warning: TriangleAlert, success: CircleCheck };
const LABEL = { info: 'Note', tip: 'Tip', warning: 'Warning', success: 'Good news' };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: Variant) => ReturnType;
      toggleCallout: (variant?: Variant) => ReturnType;
    };
    pullQuote: {
      setPullQuote: () => ReturnType;
    };
  }
}

function CalloutView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const variant = (node.attrs.variant || 'info') as Variant;
  const Icon = ICON[variant];
  const next = VARIANTS[(VARIANTS.indexOf(variant) + 1) % VARIANTS.length];
  return (
    <NodeViewWrapper as="aside" className="callout" data-variant={variant}>
      <button
        type="button"
        contentEditable={false}
        className="callout-icon -m-1 grid !size-[1.9em] shrink-0 place-items-center rounded-full p-1 hover:bg-white/70"
        title={`${LABEL[variant]} — tap to change to ${LABEL[next]}`}
        aria-label={`Callout style: ${LABEL[variant]}. Change to ${LABEL[next]}`}
        onClick={() => editor.isEditable && updateAttributes({ variant: next })}
      >
        <Icon className="size-full" />
      </button>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-variant') || 'info',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside.callout' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { class: 'callout' }), ['div', { class: 'callout-body' }, 0]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        (variant = 'info') =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      toggleCallout:
        (variant = 'info') =>
        ({ commands, editor }) =>
          editor.isActive(this.name) ? commands.lift(this.name) : commands.wrapIn(this.name, { variant }),
    };
  },
});

function PullQuoteView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="figure" className="pull-quote">
      <NodeViewContent as="div" className="outline-none" />
      <input
        contentEditable={false}
        value={node.attrs.cite || ''}
        readOnly={!editor.isEditable}
        onChange={(e) => updateAttributes({ cite: e.target.value })}
        placeholder="Who said it? (optional)"
        aria-label="Quote attribution"
        className="mt-3 block w-full bg-transparent font-sans text-[0.5em] font-[500] tracking-normal text-ink-faint outline-none placeholder:text-ink-faint/60"
      />
    </NodeViewWrapper>
  );
}

/** A large, highlighted quotation that breaks up long stories. */
export const PullQuote = Node.create({
  name: 'pullQuote',
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,

  addAttributes() {
    return { cite: { default: '' } };
  },

  parseHTML() {
    return [{ tag: 'figure.pull-quote', contentElement: 'blockquote' }];
  },

  renderHTML({ node }) {
    return ['figure', { class: 'pull-quote' }, ['blockquote', {}, 0], ['figcaption', {}, node.attrs.cite || '']];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PullQuoteView);
  },

  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      // Enter leaves the quote and starts a normal paragraph below it.
      Enter: ({ editor }) => {
        if (!editor.isActive(this.name)) return false;
        const pos = editor.state.selection.$from.after();
        return editor.chain().insertContentAt(pos, { type: 'paragraph' }).setTextSelection(pos + 1).run();
      },
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== this.name || $from.parent.content.size > 0) return false;
        return editor.commands.setNode('paragraph');
      },
    };
  },
});
