# Build log

## M0 — Setup & data spike (2026-10-20)
- **Built:** Vite 8 + React 18 + R3F 8 + Tailwind 4 + TS 5.9 scaffold; `npm run data` pipeline (fetch FX/macro/Big Mac/BIS → build → validate) writing 6 JSON snapshots for all 12 places; blank golden-hour canvas with fonts; refresh-data GitHub Action.
- **Expected:** All §5 endpoints to work as written.
- **Actually:** Frankfurter moved to `api.frankfurter.dev/v1` (`.app` 301s). World Bank `PA.NUS.PPPC.RF` is archived (source 57, stale) → derived as `PA.NUS.PRVT.PP ÷ PA.NUS.FCRF` (household-consumption PPP; within ~0–10% of the archived GDP-based ratio, Switzerland archived value looks like a 1.000 placeholder). `FR.INR.RINR` has no France/Türkiye data and stops 2014 (UK), 2017 (Japan) → added BIS policy rates via API and a derived "policy rate − CPI inflation" real rate. Big Mac has no France row → euro-area (EUZ). BRL/INR ECB data starts 2000. No month-over-month FX move exceeds 40% (largest: TRY Dec 2021 +25.9%).
