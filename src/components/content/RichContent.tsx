import { Fragment, type ReactNode } from 'react';
import { Info, Lightbulb, TriangleAlert, CircleCheck } from 'lucide-react';
import type { JSONNode } from '@/lib/types';
import { cn } from '@/lib/format';

/**
 * Renders a stored Tiptap JSON document as React elements.
 * The backend already strips unknown nodes and unsafe URLs; this renderer
 * also only knows an allowlist of node types, so raw HTML is never injected.
 * Keep it in step with the editor extensions in src/components/admin/editor.
 */

const CALLOUT_ICON = { info: Info, tip: Lightbulb, warning: TriangleAlert, success: CircleCheck } as const;

function youtubeEmbed(src: string, start?: number) {
  try {
    const u = new URL(src);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2];
    else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    else id = u.searchParams.get('v') || '';
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`;
  } catch {
    return null;
  }
}

function alignProps(attrs?: Record<string, any>) {
  const a = attrs?.textAlign;
  return a && a !== 'left' ? { 'data-align': a, style: { textAlign: a } as const } : {};
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function nodeText(node: JSONNode): string {
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(nodeText).join('');
}

function renderMarks(text: string, marks: JSONNode['marks'], key: number): ReactNode {
  let out: ReactNode = text;
  for (const mark of marks || []) {
    switch (mark.type) {
      case 'bold':
        out = <strong>{out}</strong>;
        break;
      case 'italic':
        out = <em>{out}</em>;
        break;
      case 'underline':
        out = <u>{out}</u>;
        break;
      case 'strike':
        out = <s>{out}</s>;
        break;
      case 'code':
        out = <code>{out}</code>;
        break;
      case 'subscript':
        out = <sub>{out}</sub>;
        break;
      case 'superscript':
        out = <sup>{out}</sup>;
        break;
      case 'highlight':
        out = mark.attrs?.color ? (
          <mark data-color style={{ ['--mark-color' as string]: mark.attrs.color }}>
            {out}
          </mark>
        ) : (
          <mark>{out}</mark>
        );
        break;
      case 'textStyle':
        if (mark.attrs?.color) out = <span style={{ color: mark.attrs.color }}>{out}</span>;
        break;
      case 'link': {
        const href: string = mark.attrs?.href || '#';
        const external = /^https?:\/\//.test(href);
        out = (
          <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {out}
          </a>
        );
        break;
      }
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}

function renderChildren(node: JSONNode, ctx: Ctx) {
  return (node.content || []).map((child, i) => renderNode(child, i, ctx));
}

type Ctx = { headingIds: Map<string, number> };

function renderNode(node: JSONNode, key: number, ctx: Ctx): ReactNode {
  const a = node.attrs || {};
  switch (node.type) {
    case 'text':
      return renderMarks(node.text || '', node.marks, key);
    case 'hardBreak':
      return <br key={key} />;
    case 'paragraph':
      return (
        <p key={key} {...alignProps(a)}>
          {renderChildren(node, ctx)}
        </p>
      );
    case 'heading': {
      const level = Math.min(4, Math.max(2, Number(a.level) || 2));
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      let id = slugifyHeading(nodeText(node)) || 'section';
      const seen = ctx.headingIds.get(id) || 0;
      ctx.headingIds.set(id, seen + 1);
      if (seen) id = `${id}-${seen + 1}`;
      return (
        <Tag key={key} id={id} {...alignProps(a)}>
          {renderChildren(node, ctx)}
        </Tag>
      );
    }
    case 'bulletList':
      return <ul key={key}>{renderChildren(node, ctx)}</ul>;
    case 'orderedList':
      return (
        <ol key={key} start={a.start && a.start !== 1 ? a.start : undefined}>
          {renderChildren(node, ctx)}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{renderChildren(node, ctx)}</li>;
    case 'taskList':
      return (
        <ul key={key} data-type="taskList">
          {renderChildren(node, ctx)}
        </ul>
      );
    case 'taskItem':
      return (
        <li key={key} data-checked={a.checked ? 'true' : 'false'}>
          <label>
            <input type="checkbox" checked={!!a.checked} readOnly disabled aria-label={a.checked ? 'Done' : 'Not done'} />
          </label>
          <div>{renderChildren(node, ctx)}</div>
        </li>
      );
    case 'blockquote':
      return <blockquote key={key}>{renderChildren(node, ctx)}</blockquote>;
    case 'pullQuote':
      return (
        <figure key={key} className="pull-quote">
          <blockquote style={{ all: 'unset' }}>{renderChildren(node, ctx)}</blockquote>
          {a.cite ? <figcaption data-cite>{a.cite}</figcaption> : null}
        </figure>
      );
    case 'codeBlock':
      return (
        <pre key={key} data-language={a.language || undefined}>
          <code>{nodeText(node)}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr key={key} />;
    case 'image': {
      if (!a.src) return null;
      return (
        <figure key={key} data-layout={a.layout || 'normal'}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.src}
            alt={a.alt || ''}
            title={a.title || undefined}
            width={a.width || undefined}
            height={a.height || undefined}
            loading="lazy"
            decoding="async"
          />
          {a.caption ? <figcaption>{a.caption}</figcaption> : null}
        </figure>
      );
    }
    case 'youtube': {
      const src = youtubeEmbed(a.src, a.start);
      if (!src) return null;
      return (
        <div key={key} className="embed">
          <iframe
            src={src}
            title="Embedded video"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }
    case 'table':
      return (
        <div key={key} className="table-wrap">
          <table>
            <tbody>{renderChildren(node, ctx)}</tbody>
          </table>
        </div>
      );
    case 'tableRow':
      return <tr key={key}>{renderChildren(node, ctx)}</tr>;
    case 'tableHeader':
      return (
        <th key={key} colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}>
          {renderChildren(node, ctx)}
        </th>
      );
    case 'tableCell':
      return (
        <td key={key} colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}>
          {renderChildren(node, ctx)}
        </td>
      );
    case 'callout': {
      const variant = (a.variant || 'info') as keyof typeof CALLOUT_ICON;
      const Icon = CALLOUT_ICON[variant] || Info;
      return (
        <aside key={key} className="callout" data-variant={variant}>
          <Icon className="callout-icon" aria-hidden strokeWidth={2} />
          <div className="callout-body">{renderChildren(node, ctx)}</div>
        </aside>
      );
    }
    default:
      return null;
  }
}

export function RichContent({ doc, className, dropCap }: { doc: JSONNode; className?: string; dropCap?: boolean }) {
  const ctx: Ctx = { headingIds: new Map() };
  return <div className={cn('rich', dropCap && 'has-dropcap', className)}>{renderChildren(doc, ctx)}</div>;
}

/** Headings for an "In this story" outline. */
export function extractHeadings(doc: JSONNode) {
  const seen = new Map<string, number>();
  return (doc.content || [])
    .filter((n) => n.type === 'heading' && Number(n.attrs?.level) === 2)
    .map((n) => {
      const text = nodeText(n);
      let id = slugifyHeading(text) || 'section';
      const c = seen.get(id) || 0;
      seen.set(id, c + 1);
      if (c) id = `${id}-${c + 1}`;
      return { id, text };
    });
}
