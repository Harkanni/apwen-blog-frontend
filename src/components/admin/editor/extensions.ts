'use client';

import StarterKit from '@tiptap/starter-kit';
import { Placeholder, CharacterCount, Focus } from '@tiptap/extensions';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Youtube from '@tiptap/extension-youtube';
import { Figure } from './Figure';
import { Callout, PullQuote } from './blocks';
import { SlashCommand } from './SlashCommand';

/** Every node/mark here must also be handled by:
 *   - the backend allowlist (apwen-blog-backend/src/lib/content.js)
 *   - the public renderer (src/components/content/RichContent.tsx) */
export function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        HTMLAttributes: { rel: 'noopener noreferrer', target: null },
      },
      codeBlock: { HTMLAttributes: { spellcheck: 'false' } },
      dropcursor: { color: '#6b2fa3', width: 3 },
    }),
    Placeholder.configure({
      includeChildren: false,
      placeholder: ({ node, editor }) => {
        if (node.type.name === 'heading') return 'Heading';
        if (node.type.name === 'pullQuote') return 'Type a memorable line…';
        if (editor.isEmpty) return 'Start writing your story. Type / for headings, images, quotes and more.';
        return 'Type / for blocks';
      },
    }),
    CharacterCount,
    Focus.configure({ className: 'has-focus', mode: 'shallowest' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false, HTMLAttributes: { class: 'table' } }),
    TableRow,
    TableHeader,
    TableCell,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
    Subscript,
    Superscript,
    Youtube.configure({ nocookie: true, controls: true, width: 960, height: 540, HTMLAttributes: { class: 'embed' } }),
    Figure,
    Callout,
    PullQuote,
    SlashCommand,
  ];
}
