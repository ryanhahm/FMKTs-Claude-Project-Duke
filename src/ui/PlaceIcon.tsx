/** Flag-free, blocky landmark glyphs (24×24, filled with currentColor) for the home-country cards. */
const ICONS: Record<string, JSX.Element> = {
  'new-york': (
    <>
      <rect x="2" y="12" width="4" height="10" />
      <rect x="7" y="6" width="4" height="16" />
      <rect x="8.5" y="3" width="1" height="3" />
      <rect x="12" y="9" width="4" height="13" />
      <rect x="17" y="13" width="5" height="9" />
    </>
  ),
  paris: (
    <>
      <polygon points="12,2 13,2 15,12 18,22 15,22 12.5,15 10,22 6,22 9,12 11,2" />
      <rect x="7.5" y="11" width="9" height="1.6" />
      <rect x="9.5" y="6.5" width="5" height="1.2" />
    </>
  ),
  london: (
    <>
      <rect x="9" y="7" width="6" height="15" />
      <polygon points="9,7 12,2 15,7" />
      <rect x="10.2" y="8.5" width="3.6" height="3.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="3" y="16" width="5" height="6" />
      <rect x="16" y="16" width="5" height="6" />
    </>
  ),
  tokyo: (
    <>
      <rect x="4" y="7" width="16" height="2" />
      <rect x="3" y="5" width="18" height="1.6" />
      <rect x="6" y="9" width="2" height="13" />
      <rect x="16" y="9" width="2" height="13" />
      <rect x="5" y="12" width="14" height="1.4" />
    </>
  ),
  zurich: (
    <>
      <polygon points="1,21 8,8 12,14 15,10 23,21" />
      <polygon points="8,8 10,11.5 6.3,11.5" fill="#fff" fillOpacity="0.6" />
      <rect x="1" y="21" width="22" height="1.5" />
    </>
  ),
  istanbul: (
    <>
      <rect x="5" y="14" width="14" height="8" />
      <path d="M7 14 a5 5 0 0 1 10 0 Z" />
      <rect x="11.5" y="7" width="1" height="2.5" />
      <rect x="2" y="6" width="1.6" height="16" />
      <polygon points="2,6 2.8,3 3.6,6" />
      <rect x="20.4" y="6" width="1.6" height="16" />
      <polygon points="20.4,6 21.2,3 22,6" />
    </>
  ),
  'mexico-city': (
    <>
      <rect x="10.8" y="6" width="2.4" height="14" />
      <rect x="8" y="20" width="8" height="2" />
      <rect x="9.5" y="5" width="5" height="1.2" />
      <polygon points="12,1 13.6,4.4 10.4,4.4" />
      <polygon points="9,2.5 11,4 9.5,4.4" />
      <polygon points="15,2.5 13,4 14.5,4.4" />
    </>
  ),
  rio: (
    <>
      <path d="M2 22 C3 12, 6 8, 9 9 C11 10, 11 22, 11 22 Z" />
      <path d="M10 22 C11 17, 13 15, 15 16 C17 17, 17 22, 17 22 Z" />
      <rect x="1" y="21" width="22" height="1.5" />
      <rect x="19" y="14" width="1" height="7" />
      <polygon points="17,14 22,14 19.5,12" />
    </>
  ),
  mumbai: (
    <>
      <path d="M4 22 V8 H20 V22 H15 V15 a3 3 0 0 0 -6 0 V22 Z" />
      <rect x="3" y="6" width="18" height="2" />
      <rect x="4" y="3.5" width="2.5" height="2.5" />
      <rect x="17.5" y="3.5" width="2.5" height="2.5" />
    </>
  ),
  seoul: (
    <>
      <polygon points="0,22 7,14 12,17 18,12 24,22" />
      <rect x="11.4" y="4" width="1.2" height="12" />
      <rect x="10" y="7" width="4" height="2.4" />
      <rect x="11.8" y="1.5" width="0.4" height="2.5" />
    </>
  ),
  'cape-town': (
    <>
      <polygon points="1,22 5,10 19,10 23,22" />
      <rect x="5" y="10" width="14" height="1.2" fill="#fff" fillOpacity="0.5" />
      <rect x="1" y="21" width="22" height="1.5" />
    </>
  ),
  sydney: (
    <>
      <polygon points="3,20 8,8 10,20" />
      <polygon points="8,20 13,6 15,20" />
      <polygon points="13,20 18,10 20,20" />
      <rect x="2" y="20" width="20" height="2" />
    </>
  ),
};

export function PlaceIcon({ id, className = '' }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {ICONS[id]}
    </svg>
  );
}
