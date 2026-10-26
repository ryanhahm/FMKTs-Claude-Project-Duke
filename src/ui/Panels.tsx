import { useEffect, useRef, type ReactNode } from 'react';
import { EVENTS } from '../data/events';
import { BASKET } from '../finance/basket';
import { useGame } from '../state/useGame';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel max-h-[86vh] w-full max-w-[720px] overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h1 className="panel-title !mb-0">{title}</h1>
          <button className="btn-ghost-dark text-lg" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="prose-panel">{children}</div>
      </div>
    </div>
  );
}

export function DataPanel({ onClose }: { onClose: () => void }) {
  const { meta, fxLatest, ratesLive } = useGame();
  return (
    <Modal title="Data sources" onClose={onClose}>
      <p>
        Data last updated <b>{meta ? new Date(meta.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</b>. A scheduled job
        refreshes everything every weekday after the ECB publishes its rates.
        {fxLatest && (
          <>
            {' '}
            Exchange rates shown: ECB reference rates of <b>{fxLatest.date}</b>
            {ratesLive ? ' (fetched live just now)' : ' (from the saved snapshot)'}.
          </>
        )}
      </p>
      <h2>Sources</h2>
      <ul>
        {meta?.sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name}
            </a>
            <br />
            <span className="muted">
              {s.coverage}. Latest observation: {s.lastObservation}.
            </span>
            {s.notes && (
              <>
                <br />
                <span className="muted">{s.notes}</span>
              </>
            )}
          </li>
        ))}
        <li>
          Land outlines on the globe: Natural Earth 1:110m (public domain).
        </li>
      </ul>
      <h2>What is an estimate, and how it’s computed</h2>
      <ul>
        <li>
          <b>Price level (“What it buys”).</b> World Bank PPP conversion factor for household consumption (PA.NUS.PRVT.PP) ÷ today’s exchange rate per U.S.
          dollar. Relative price level = destination ÷ home. “Feels like” = your amount ÷ relative price level. The PPP factor is annual and lags 1–2 years.
        </li>
        <li>
          <b>Everyday basket ≈ estimates.</b> Reference U.S. prices set by the team (not survey data):{' '}
          {BASKET.filter((b) => b.id !== 'burger')
            .map((b) => `${b.label.toLowerCase()} $${b.usd.toFixed(2)}`)
            .join(', ')}
          . Each country’s price = reference × its PPP factor. The Big Mac row uses actual prices from The Economist.
        </li>
        <li>
          <b>Globe colors (“goes further than usual”).</b> Inflation-adjusted exchange rate today vs its average over the last 10 years: rate × home CPI ÷
          destination CPI, using annual World Bank inflation interpolated by month. Where the latest year isn’t published yet (e.g. 2026), the most recent
          year’s inflation rate is carried forward. Within ±5% counts as “about usual”.
        </li>
        <li>
          <b>Real interest rate (“Why”).</b> Annual average of the BIS central-bank policy rate minus World Bank CPI inflation — consistent across all 12
          countries.
        </li>
        <li>
          <b>Timeline weather.</b> The selected month’s exchange rate ranked against every month since 1999 (percentile). Crisis months are the events listed
          below and the month after.
        </li>
        <li>Missing data is shown as “No data”, never as zero. Euro-area figures use France’s data.</li>
      </ul>
      <h2>Historical events</h2>
      <ul>
        {EVENTS.map((e) => (
          <li key={e.date + e.title}>
            {e.date} — {e.title}{' '}
            <a href={e.sourceUrl} target="_blank" rel="noreferrer">
              source
            </a>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About Coin Atlas" onClose={onClose}>
      <p>
        Coin Atlas is a small game about international finance: what your money is worth abroad, what it actually buys, how that has changed over time, and
        why currencies move. It uses real, regularly updated data from the European Central Bank, the World Bank, the Bank for International Settlements and
        The Economist.
      </p>
      <p>
        Built for FMKT 256 (Duke University, Fall 2026) by <i>team names coming soon</i>, with Claude Code.
      </p>
      <p className="muted">
        Educational tool. The models are deliberately simplified and every estimate is labelled. Nothing here is financial advice.
      </p>
    </Modal>
  );
}
