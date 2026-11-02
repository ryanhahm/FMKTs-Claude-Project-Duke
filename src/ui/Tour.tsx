import { useEffect, useRef, useState } from 'react';
import { placeById, useGame, type Screen, type TabId } from '../state/useGame';
import { markTourSeen } from '../state/persist';

type Step = {
  screen: Screen;
  tab?: TabId;
  /** Timeline month to jump to (YYYY-MM). */
  month?: string;
  /** `data-tour` anchor to ring. */
  target: string;
  /** Where the card sits (default right), chosen to keep that step's content visible. */
  place?: 'right' | 'left' | 'bottom-left';
  title: string;
  body: string;
};

/** Guided first-run tour: walks the globe, one city's four tabs, Central Bank mode and the Data panel. */
function steps(home: string, dest: string): Step[] {
  return [
    {
      screen: 'globe', target: 'carrying', title: 'Welcome to Parity',
      body: `See how far your ${home} go around the world. Every number comes from real data: ECB exchange rates, World Bank prices and BIS interest rates.`,
    },
    {
      screen: 'globe', target: 'legend', title: 'Read the globe',
      body: 'Each landmark is a city. Gold means your money goes further there than its 10-year average, after adjusting for inflation. Red-brown means it goes less far. Hover a city for a quick quote, click to visit.',
    },
    {
      screen: 'city', tab: 'worth', target: 'tab-worth', title: "1 · What it's worth",
      body: `Welcome to ${dest}. This tab shows today's exchange rate, what your money converts to, and whether your currency is strong or weak against its 10-year average.`,
    },
    {
      screen: 'city', tab: 'buys', target: 'tab-buys', place: 'bottom-left', title: '2 · What it buys',
      body: "An exchange rate doesn't tell you what things cost. Prices here use World Bank purchasing-power data, and the Big Mac Index checks it against a real burger price.",
    },
    {
      screen: 'city', tab: 'timeline', month: '2008-09', target: 'tab-timeline', title: '3 · Through the years',
      body: 'Monthly rates since 1999. Drag the slider or press play: the weather follows your currency, from sunny when it is strong to night and rain when it is weak. Crises like Lehman Brothers are marked. Try "Invest there" to see if chasing higher interest rates paid off.',
    },
    {
      screen: 'city', tab: 'why', target: 'tab-why', place: 'left', title: '4 · Why it moves',
      body: 'Five forces behind a currency: inflation, real interest rates, trade balance, reserves and growth. Arrows show whether each one pushes this currency up or down against yours.',
    },
    {
      screen: 'city', tab: 'worth', target: 'modes', title: 'Run a central bank',
      body: 'Under Modes, Central Bank puts you in charge during a real crisis: Switzerland 2015, Türkiye 2018, the UK 2022 or Japan 2022. Afterwards, see what really happened.',
    },
    {
      screen: 'city', tab: 'worth', target: 'data', title: 'Where the numbers come from',
      body: 'Data lists every source, when it last updated (automatically, every weekday) and which figures are estimates. Drag the scene to look around, or press H to hide the panels.',
    },
  ];
}

export function Tour() {
  const { tour, setTour, screen, fading, go, setTab, setTimelineIndex, profile, fxMonthly } = useGame();
  const home = placeById(profile.homeId);
  const destId = home.id === 'paris' ? 'tokyo' : 'paris';
  const list = steps(home.currencyPlural, placeById(destId).city);
  const step = tour === null ? null : list[tour];
  const applied = useRef<number | null>(null);
  // Phones: put the card in the other half of the screen from the anchor.
  const [anchorTop, setAnchorTop] = useState(false);

  // Move the app to the step's screen/tab once per step, then leave the player free to poke around.
  useEffect(() => {
    if (tour === null || !step || fading || applied.current === tour) return;
    if (screen !== step.screen) {
      go(step.screen, step.screen === 'city' ? destId : undefined);
      return;
    }
    applied.current = tour;
    if (step.tab) setTab(step.tab);
    if (step.month && fxMonthly) {
      const i = fxMonthly.months.indexOf(step.month);
      if (i >= 0) setTimelineIndex(i);
    }
  }, [tour, step, screen, fading, go, setTab, setTimelineIndex, fxMonthly, destId]);

  // Ring the anchor (it may mount only after a screen fade, so look for it a few times).
  useEffect(() => {
    if (!step) return;
    let el: Element | null = null;
    let tries = 0;
    const h = setInterval(() => {
      el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el || ++tries > 20) {
        clearInterval(h);
        el?.classList.add('tour-ring');
        const r = el?.getBoundingClientRect();
        setAnchorTop(!!r && r.top + r.height / 2 < window.innerHeight / 2);
      }
    }, 150);
    return () => {
      clearInterval(h);
      el?.classList.remove('tour-ring');
    };
  }, [step, screen]);

  const end = () => {
    markTourSeen();
    applied.current = null;
    setTour(null);
    setTimelineIndex(null);
  };

  useEffect(() => {
    if (tour === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && end();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!step || tour === null) return null;
  const last = tour === list.length - 1;
  return (
    <div className={`tour-card panel tour-${step.place ?? 'right'} ${anchorTop ? 'tour-flip' : ''}`} role="dialog" aria-label="Guided tour" aria-live="polite">
      <div className="mb-1 flex items-center justify-between font-sans text-xs font-semibold tracking-wide text-ink/60">
        <span>
          {tour + 1} / {list.length}
        </span>
        <button className="btn-ghost-dark !text-xs" onClick={end}>
          Skip tour
        </button>
      </div>
      <h2 className="font-sans text-lg font-bold text-ink">{step.title}</h2>
      <p className="mt-1 font-sans text-sm leading-relaxed text-ink/85">{step.body}</p>
      <div className="mt-3 flex justify-end gap-2">
        {tour > 0 && (
          <button className="btn-ghost-dark px-2" onClick={() => setTour(tour - 1)}>
            Back
          </button>
        )}
        <button className="btn-primary !py-2" onClick={() => (last ? end() : setTour(tour + 1))} autoFocus>
          {last ? 'Start exploring' : 'Next'}
        </button>
      </div>
    </div>
  );
}
