import { lazy, Suspense } from 'react';
import { useCityData } from '../../hooks/useCityData';
import { useGame } from '../../state/useGame';
import { Caption } from '../Caption';
import { TabBar } from '../TabBar';
import { BuysHud, BuysPanel } from '../tabs/BuysTab';
import { WhyPanel } from '../tabs/WhyTab';
import { WorthTab } from '../tabs/WorthTab';

// Recharts only loads when the timeline is opened.
const TimelineHud = lazy(() => import('../tabs/TimelineTab').then((m) => ({ default: m.TimelineHud })));
const TimelinePanel = lazy(() => import('../tabs/TimelineTab').then((m) => ({ default: m.TimelinePanel })));

export function CityHud() {
  const { profile, tab, setTab } = useGame();
  const d = useCityData();
  if (!d) return null;
  const { home, dest, converted, sameCurrency } = d;

  const hud =
    tab === 'worth' ? <WorthTab d={d} amount={profile.amount} /> : tab === 'buys' ? <BuysHud d={d} amount={profile.amount} /> : tab === 'timeline' ? <TimelineHud d={d} /> : null;

  return (
    <>
      {hud && (
        <section className="hud-column" aria-label="City figures">
          <Suspense fallback={null}>{hud}</Suspense>
        </section>
      )}

      {tab === 'worth' && (
        <div className="arrival-caption pointer-events-none absolute inset-x-0 bottom-[22%] hidden px-6 text-center sm:block">
          <Caption
            text={
              sameCurrency
                ? `${dest.city}. Same currency as home.`
                : `${dest.city}. Your ${profile.amount.toLocaleString('en-US')} ${home.currencyPlural.replace('U.S. ', '')} become ${Math.round(converted).toLocaleString('en-US')} ${dest.currencyPlural}.`
            }
          />
        </div>
      )}

      {(tab === 'buys' || tab === 'why') && (
        <aside className="side-panel" aria-label={tab === 'buys' ? 'Prices' : 'What moves this currency'}>
          {tab === 'buys' ? <BuysPanel d={d} /> : <WhyPanel d={d} />}
        </aside>
      )}

      {tab === 'timeline' && (
        <div className="timeline-dock">
          <Suspense fallback={null}>
            <TimelinePanel d={d} />
          </Suspense>
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
