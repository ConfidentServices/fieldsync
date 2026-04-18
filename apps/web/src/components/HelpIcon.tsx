'use client';

import { useState } from 'react';
import type { HelpArticle, HelpSection } from '@/lib/utils/help-content';

// ─── Inline help icon that opens a modal ────────────────────────────────────

interface HelpIconProps {
  articleId?: string;
  article?: HelpArticle;
  label?: string; // tooltip label
}

export function HelpIcon({ article, label }: HelpIconProps) {
  const [open, setOpen] = useState(false);

  if (!article) {
    return (
      <button
        className="w-4 h-4 rounded-full border border-slate-600 text-slate-600 text-xs font-bold hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center leading-none"
        title={label ?? 'Help'}
        onClick={() => {}}
        aria-label="Help"
      >
        ?
      </button>
    );
  }

  return (
    <>
      <button
        className="w-4 h-4 rounded-full border border-slate-600 text-slate-600 text-xs font-bold hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center leading-none"
        title={label ?? article.title}
        onClick={() => setOpen(true)}
        aria-label={`Help: ${article.title}`}
      >
        ?
      </button>

      {open && (
        <HelpModal article={article} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// ─── Help Modal ──────────────────────────────────────────────────────────────

function HelpModal({ article, onClose }: { article: HelpArticle; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#12121a] border border-[#2a2a3a] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2a2a3a]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span>{article.categoryIcon}</span>
              <span className="text-xs text-slate-500">{article.category}</span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{article.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{article.summary}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1a1a24] text-slate-500 hover:text-slate-300 flex items-center justify-center text-lg leading-none ml-4 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {article.body.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
          <div className="text-xs text-slate-600 pt-2 border-t border-[#2a2a3a]">
            Last updated: {article.updatedAt}
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderSection({ section }: { section: HelpSection }) {
  switch (section.type) {
    case 'heading':
      return <h3 className="text-sm font-bold text-slate-200 mt-2">{section.content}</h3>;

    case 'text':
      return (
        <p
          className="text-sm text-slate-400 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(section.content) }}
        />
      );

    case 'list':
      return (
        <ul className="space-y-1.5">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-slate-600 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatMarkdown(item) }} />
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const styles = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        success: 'bg-green-500/10 border-green-500/30 text-green-300',
        danger: 'bg-red-500/10 border-red-500/30 text-red-300',
      };
      const icons = { info: 'ℹ', warning: '⚠', success: '✓', danger: '⛔' };
      const v = section.variant ?? 'info';
      return (
        <div className={`flex gap-2.5 p-3.5 rounded-lg border text-sm ${styles[v]}`}>
          <span className="text-base shrink-0">{icons[v]}</span>
          <span dangerouslySetInnerHTML={{ __html: formatMarkdown(section.content) }} />
        </div>
      );
    }

    case 'table':
      if (!section.headers || !section.rows) return null;
      return (
        <div className="overflow-x-auto rounded-lg border border-[#2a2a3a]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                {section.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 bg-[#1a1a24]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#1e1e2e] last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-3 py-2 text-slate-400"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(cell) }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-[#1a1a24] px-1 py-0.5 rounded text-green-300 text-xs">$1</code>');
}
