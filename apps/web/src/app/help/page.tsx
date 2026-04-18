/**
 * FieldSync Help Center
 * ======================
 * Searchable documentation for every feature.
 * Real article content — not placeholder text.
 * Inline "?" icons throughout the app link here.
 */

import { HELP_ARTICLES, getArticlesByCategory, type HelpArticle, type HelpSection } from '@/lib/utils/help-content';
import { AppNav } from '@/components/AppNav';
import { getMockDashboardData } from '@/lib/utils/mock-data';
import { getInboxSummary } from '@/lib/utils/mock-inbox';

const dash = getMockDashboardData();
const inboxSummary = getInboxSummary();
const byCategory = getArticlesByCategory();

// ─── Article renderer (server-side) ──────────────────────────────────────────

function renderSection(section: HelpSection, i: number) {
  switch (section.type) {
    case 'heading':
      return (
        <h3 key={i} className="text-sm font-bold text-slate-200 mt-4 mb-1">
          {section.content}
        </h3>
      );

    case 'text':
      return (
        <p
          key={i}
          className="text-sm text-slate-400 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: fmt(section.content) }}
        />
      );

    case 'list':
      return (
        <ul key={i} className="space-y-1.5 my-1">
          {section.items?.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-slate-600 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: fmt(item) }} />
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const styles: Record<string, string> = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        success: 'bg-green-500/10 border-green-500/30 text-green-300',
        danger: 'bg-red-500/10 border-red-500/30 text-red-300',
      };
      const icons: Record<string, string> = { info: 'ℹ', warning: '⚠', success: '✓', danger: '⛔' };
      const v = section.variant ?? 'info';
      return (
        <div key={i} className={`flex gap-2.5 p-3.5 rounded-lg border text-sm my-2 ${styles[v]}`}>
          <span className="text-base shrink-0">{icons[v]}</span>
          <span dangerouslySetInnerHTML={{ __html: fmt(section.content) }} />
        </div>
      );
    }

    case 'table':
      if (!section.headers || !section.rows) return null;
      return (
        <div key={i} className="overflow-x-auto rounded-lg border border-[#2a2a3a] my-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a3a] bg-[#1a1a24]">
                {section.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#12121a]">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 text-slate-400"
                      dangerouslySetInnerHTML={{ __html: fmt(cell) }}
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

function fmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-[#1a1a24] px-1 py-0.5 rounded text-green-300 text-xs">$1</code>');
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <a
      href={`#article-${article.id}`}
      className="block bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 hover:border-blue-500/40 hover:bg-[#1e1e2e] transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{article.categoryIcon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
            {article.title}
          </p>
          <p className="text-xs text-slate-500 mt-1">{article.summary}</p>
        </div>
      </div>
    </a>
  );
}

// ─── Full article ─────────────────────────────────────────────────────────────

function ArticleFull({ article }: { article: HelpArticle }) {
  return (
    <article
      id={`article-${article.id}`}
      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 scroll-mt-20"
    >
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[#2a2a3a]">
        <span className="text-3xl">{article.categoryIcon}</span>
        <div>
          <p className="text-xs text-slate-500 mb-1">{article.category}</p>
          <h2 className="text-lg font-bold text-slate-100">{article.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{article.summary}</p>
        </div>
      </div>

      <div className="space-y-2">
        {article.body.map((section, i) => renderSection(section, i))}
      </div>

      <div className="mt-5 pt-3 border-t border-[#2a2a3a] flex items-center justify-between text-xs text-slate-600">
        <span>Updated: {article.updatedAt}</span>
        <div className="flex gap-2">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-[#12121a] border border-[#2a2a3a] rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans">
      <AppNav
        companyName={dash.company.name}
        inboxUnread={inboxSummary.unread}
        pendingApprovals={dash.pendingApprovals.length}
        syncMinutesAgo={dash.company.syncMinutesAgo}
        crmType={dash.company.crmType}
      />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Help Center</h1>
          <p className="text-slate-400 mt-2">
            Everything you need to understand and trust FieldSync. Every feature documented.
          </p>
        </div>

        {/* Search */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search documentation... (e.g., 'auto-send', 'route optimization', 'data export')"
              className="flex-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <button className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm font-semibold rounded-lg hover:bg-blue-500/30 transition-colors">
              Search
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {HELP_ARTICLES.length} articles across {byCategory.size} categories
          </p>
        </div>

        {/* Category quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from(byCategory.entries()).map(([cat, articles]) => {
            const icon = articles[0].categoryIcon;
            return (
              <a
                key={cat}
                href={`#cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-3 hover:border-blue-500/40 transition-all group"
              >
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300 group-hover:text-white">{cat}</p>
                  <p className="text-xs text-slate-600">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
                </div>
              </a>
            );
          })}
        </div>

        {/* Articles by category — full content */}
        {Array.from(byCategory.entries()).map(([cat, articles]) => (
          <section
            key={cat}
            id={`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            className="space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{articles[0].categoryIcon}</span>
              <h2 className="text-base font-bold text-slate-200">{cat}</h2>
              <div className="flex-1 h-px bg-[#2a2a3a]" />
              <span className="text-xs text-slate-600">{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
            </div>

            {articles.map((article) => (
              <ArticleFull key={article.id} article={article} />
            ))}
          </section>
        ))}

        {/* Still need help */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 text-center">
          <p className="text-lg font-bold text-slate-200 mb-2">Still have questions?</p>
          <p className="text-sm text-slate-400 mb-4">
            Ask Sofia in the dashboard — she knows your setup and can answer questions about your
            specific data. Or reach our team directly.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-semibold rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Ask Sofia
            </a>
            <a
              href="mailto:support@fieldsync.io"
              className="px-4 py-2 bg-[#12121a] border border-[#2a2a3a] text-slate-400 text-sm rounded-lg hover:border-slate-600 transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-700 pb-4">
          FieldSync Help Center · All features documented · Updated April 2026
        </footer>

      </main>
    </div>
  );
}
