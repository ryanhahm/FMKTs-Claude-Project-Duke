import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/useGame';

/** Top-right Modes menu (CLAUDE.md §6.5): Explore / Central Bank. */
export function ModesMenu() {
  const { screen, go } = useGame();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);
  const item = (label: string, desc: string, active: boolean, onClick: () => void) => (
    <button
      role="menuitem"
      className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-ink/5 ${active ? 'bg-ink/10' : ''}`}
      onClick={() => {
        setOpen(false);
        onClick();
      }}
    >
      <span className="block font-sans text-sm font-semibold text-ink">{label}</span>
      <span className="block font-sans text-xs text-ink/65">{desc}</span>
    </button>
  );
  return (
    <div ref={ref} className="relative">
      <button className="btn-frosted" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Modes
      </button>
      {open && (
        <div role="menu" className="panel absolute top-11 right-0 z-30 w-[260px] !p-1.5">
          {item('Explore', 'Travel the globe and compare what your money is worth', screen === 'globe' || screen === 'city', () => go('globe'))}
          {item('Central Bank', 'Run a central bank through a real currency crisis', screen === 'centralBank', () => go('centralBank'))}
        </div>
      )}
    </div>
  );
}
