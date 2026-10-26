import type { TabId } from '../state/useGame';
export type { TabId };

const TABS: { id: TabId; label: string; short: string; ready: boolean }[] = [
  { id: 'worth', label: "What it's worth", short: 'Worth', ready: true },
  { id: 'buys', label: 'What it buys', short: 'Buys', ready: true },
  { id: 'timeline', label: 'Through the years', short: 'Years', ready: true },
  { id: 'why', label: 'Why', short: 'Why', ready: true },
];

/** Frosted bottom tab bar (CLAUDE.md §2). Tabs B–D arrive in M3. */
export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="frosted absolute bottom-9 left-1/2 max-w-[calc(100vw-32px)] flex -translate-x-1/2 gap-1 p-1.5" role="tablist" aria-label="City views">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          disabled={!t.ready}
          title={t.ready ? undefined : 'Coming soon'}
          aria-label={t.label}
          onClick={() => onChange(t.id)}
          className={`rounded-xl px-3 py-2 font-sans text-sm font-semibold whitespace-nowrap transition-colors sm:px-4 sm:text-[15px] ${
            active === t.id ? 'bg-white/85 text-ink' : 'text-white enabled:hover:bg-white/20 disabled:opacity-55'
          }`}
        >
          <span className="hidden sm:inline">{t.label}</span>
          <span className="sm:hidden" aria-hidden="true">{t.short}</span>
        </button>
      ))}
    </nav>
  );
}
