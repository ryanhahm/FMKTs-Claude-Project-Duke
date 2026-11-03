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
        <li>
          <b>“Invest there” (carry trade).</b> Your amount converted at the chosen month’s exchange rate, earning the destination central bank’s policy rate
          (BIS, as a stand-in for short-term deposit rates, compounded monthly), converted back at the latest monthly rate; compared with earning the home policy
          rate. No taxes, fees or spreads. Worst drop = largest peak-to-trough fall of the invested amount in home currency.
        </li>
        <li>
          <b>Compare: does PPP hold?</b> For each currency, the average yearly gap between its inflation and yours (World Bank CPI, compounded) against its
          average yearly fall against your currency (annual averages of monthly ECB rates in the first and last year). Relative purchasing power parity predicts
          equal values (the 45° line). The slope and R² come from an ordinary least-squares fit across the currencies shown. The window ends in the latest year
          every country has inflation data; currencies without a full year of ECB rates in the start year are left out.
        </li>
        <li>Missing data is shown as “No data”, never as zero. Euro-area figures use France’s data.</li>
      </ul>
      <h2>Central Bank mode: the model</h2>
      <p>
        A deliberately simplified teaching model, not a forecast. One turn = one quarter. Starting values come from the World Bank and BIS data above; the “world”
        interest rate each quarter is the partner central bank’s actual BIS policy rate. Each quarter, with real rate = policy rate − expected inflation (expected
        inflation is pulled toward the target in proportion to credibility):
      </p>
      <ul>
        <li>
          <b>Currency</b> rises with the real-rate gap vs the world, intervention to support it and current-account surpluses; it falls with money printing,
          new debt, intervention to weaken it, and background pressure (safe-haven inflows or capital flight — a scenario assumption). Plus random noise and
          events.
        </li>
        <li>
          <b>Inflation</b> rises with an overheating economy, printing, a weaker currency (imported inflation), tariffs and buying foreign currency; it falls when
          real rates are above neutral, and a credible central bank pulls it back toward target.
        </li>
        <li>
          <b>Growth</b> falls when real rates are above neutral, when the currency strengthens (exports hurt) and with tariffs; printing boosts it.
          Unemployment follows growth (Okun’s law).
        </li>
        <li>
          <b>Reserves</b> fall when you support the currency and rise when you weaken it. Below 0.5 months of imports the currency is forcibly devalued 25%.
        </li>
        <li>
          <b>Score</b> per quarter: 30% currency stability, 30% inflation near target, 20% jobs, 10% reserves, 10% approval. All coefficients are in
          src/game/centralBank/config.ts; scenario assumptions (potential growth, neutral rate, natural unemployment, background pressure) are in scenarios.ts.
        </li>
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
    <Modal title="About Parity" onClose={onClose}>
      <p>
        Parity is a small game about international finance: what your money is worth abroad, what it actually buys, how that has changed over time, and
        why currencies move. It uses real, regularly updated data from the European Central Bank, the World Bank, the Bank for International Settlements and
        The Economist.
      </p>
      <p>
        Built for FMKT 256 (Duke University, Fall 2026) with Claude Code.
      </p>
      <p className="muted">
        Educational tool. The models are deliberately simplified and every estimate is labelled. Nothing here is financial advice.
      </p>
    </Modal>
  );
}
