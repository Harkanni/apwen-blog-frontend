'use client';

import type { Editor, Range } from '@tiptap/core';
import {
  Pilcrow, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, MessageSquareQuote, Info, Lightbulb, TriangleAlert,
  Image as ImageIcon, Minus, Table, SquarePlay, Code2, type LucideIcon,
} from 'lucide-react';

export type BlockItem = {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  keywords: string;
  run: (editor: Editor, range?: Range) => void;
};

/** Start a chain, removing the "/command" text first when called from the slash menu. */
const chain = (editor: Editor, range?: Range) => {
  const c = editor.chain().focus();
  return range ? c.deleteRange(range) : c;
};

export const BLOCK_ITEMS: BlockItem[] = [
  { key: 'text', label: 'Text', hint: 'Plain paragraph', icon: Pilcrow, keywords: 'paragraph body normal', run: (e, r) => chain(e, r).setParagraph().run() },
  { key: 'h2', label: 'Heading', hint: 'Section title', icon: Heading2, keywords: 'title h2 section big', run: (e, r) => chain(e, r).setHeading({ level: 2 }).run() },
  { key: 'h3', label: 'Subheading', hint: 'Smaller title', icon: Heading3, keywords: 'subtitle h3 small', run: (e, r) => chain(e, r).setHeading({ level: 3 }).run() },
  { key: 'image', label: 'Image', hint: 'Upload a photo', icon: ImageIcon, keywords: 'photo picture upload media', run: (e, r) => {
    chain(e, r).run();
    window.dispatchEvent(new CustomEvent('apwen:pick-image', { detail: {} }));
  } },
  { key: 'bullet', label: 'Bulleted list', hint: 'Simple list', icon: List, keywords: 'ul unordered points', run: (e, r) => chain(e, r).toggleBulletList().run() },
  { key: 'ordered', label: 'Numbered list', hint: 'Steps in order', icon: ListOrdered, keywords: 'ol ordered steps 1 2 3', run: (e, r) => chain(e, r).toggleOrderedList().run() },
  { key: 'task', label: 'Checklist', hint: 'Items to tick off', icon: ListChecks, keywords: 'todo task check', run: (e, r) => chain(e, r).toggleTaskList().run() },
  { key: 'quote', label: 'Quote', hint: 'Quote someone', icon: Quote, keywords: 'blockquote citation', run: (e, r) => chain(e, r).toggleBlockquote().run() },
  { key: 'pull', label: 'Pull quote', hint: 'Big, eye-catching quote', icon: MessageSquareQuote, keywords: 'highlight large quote feature', run: (e, r) => chain(e, r).setPullQuote().run() },
  { key: 'note', label: 'Note box', hint: 'Highlighted information', icon: Info, keywords: 'callout info box aside', run: (e, r) => chain(e, r).setCallout('info').run() },
  { key: 'tip', label: 'Tip box', hint: 'Helpful advice', icon: Lightbulb, keywords: 'callout tip advice idea', run: (e, r) => chain(e, r).setCallout('tip').run() },
  { key: 'warning', label: 'Warning box', hint: 'Something to watch out for', icon: TriangleAlert, keywords: 'callout warning alert danger caution', run: (e, r) => chain(e, r).setCallout('warning').run() },
  { key: 'divider', label: 'Divider', hint: 'Break between sections', icon: Minus, keywords: 'hr line separator break', run: (e, r) => chain(e, r).setHorizontalRule().run() },
  { key: 'table', label: 'Table', hint: 'Rows and columns', icon: Table, keywords: 'grid data columns rows', run: (e, r) => chain(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { key: 'video', label: 'YouTube video', hint: 'Embed from a link', icon: SquarePlay, keywords: 'video embed youtube film', run: (e, r) => {
    chain(e, r).run();
    window.dispatchEvent(new CustomEvent('apwen:embed-video'));
  } },
  { key: 'code', label: 'Code', hint: 'Technical snippet', icon: Code2, keywords: 'code snippet monospace pre', run: (e, r) => chain(e, r).toggleCodeBlock().run() },
];

export function filterItems(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return BLOCK_ITEMS;
  return BLOCK_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.keywords.includes(q));
}
