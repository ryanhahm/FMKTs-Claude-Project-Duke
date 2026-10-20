# Coin Atlas — Project Brief for Claude Code

> Working title: **Coin Atlas** (rename freely). An international-finance simulator and visualization game.
> Course: FMKT 256 Extra Credit Project on AI (Duke, Fall 2026), Prompt #1 — "Build a finance app."
> **Hard deadline: Tuesday, November 3, 2026 at 1:00pm ET** (submitted as a PDF with a public link).
> Team: 3–4 students. Built with Claude Code. Target: a polished, public web app that also works as a product design / PM portfolio piece.

Read this whole file before writing code. Re-read the relevant section before starting each milestone.

---

## 1. What we are building (one paragraph)

A browser game that teaches international finance — exchange rates, purchasing power, inflation, and monetary policy — through a charming low-poly, blocky 3D world. The player creates a small blocky character, picks their home country and currency, and travels a low-poly globe. Clicking a city drops the character into a 3D diorama of that city (e.g. Paris with the Eiffel Tower) where tabs show what their money is worth there, what it actually buys, how that changed over time (a timeline slider that also changes the scene's mood), and *why* the currency is where it is. A second mode, **Central Bank**, puts the player in charge of a country's monetary policy during a real historical currency crisis, using real starting data, and then reveals what actually happened. A stretch **Trip** mode challenges players to stretch a travel budget across countries.

### Non-negotiable course requirements
1. **Imports historical data and updates when new data become available.** Must be visibly true in the app (show "Data last updated: <timestamp>" and a Data Sources panel).
2. **Public web link, no login, no email requests, no API keys required by the viewer.** The grade is "significantly reduced" otherwise. Never put an API key in client code.
3. **Real finance substance.** This is graded by a finance professor. Every number must come from a cited source or be clearly labeled as a model estimate.

### Success criteria
- A first-time visitor understands what to do within 10 seconds and has a "huh, I didn't know that" moment within 60 seconds.
- Runs smoothly (≥ 50 fps) on a 2020-era MacBook Air in Chrome and Safari; usable on a phone.
- Every financial figure on screen is traceable to a source in the Data Sources panel.

---

## 2. Visual style — "blocky diorama"

The reference is a style of viral short-form 3D explainer videos: low-poly, blocky (voxel-ish but not Minecraft-textured), flat-shaded, warm cinematic lighting, with elegant serif captions floating over the scene. **Match this look closely. It is the core of the portfolio value.**

### Geometry
- Everything is built from **boxes and simple primitives** (box, cylinder with 4–8 segments, cone with 4–6 segments, icosphere detail 0–1). No smooth high-poly meshes, no realistic textures.
- **Flat shading only.** Use `MeshStandardMaterial` with `flatShading: true`, `roughness: 0.9–1.0`, `metalness: 0`. Solid colors per face group. No image textures except an optional subtle noise on ground planes.
- **People** are blocky figures: box torso, box head (slightly rounded is OK), box arms and legs, simple hair block. No faces, or at most two dark dots for eyes. Proportions slightly chunky and toy-like.
- **Trees** are cone or icosphere canopies on box trunks. **Buildings** are stacked boxes with inset darker box windows. Crops/grass can be thin instanced boxes.
- Scenes are **dioramas**: a contained floating chunk of world, framed by the camera, with soft fog fading the edges.

### Lighting and rendering
- Warm directional "golden hour" sun with **soft shadows** (`PCFSoftShadowMap`, shadow map 2048, tuned bias), plus a `HemisphereLight` (sky warm cream, ground muted terracotta) for fill.
- Gentle **exponential fog** matching the sky color. Sky is a vertical gradient (shader or large sphere with vertex colors), not a skybox image.
- Optional post-processing (only if fps stays ≥ 50): subtle bloom on glowing objects, mild vignette. Use `@react-three/postprocessing`. Must be toggleable and off on mobile by default.
- Ambient life: floating dust/light particles, slow camera drift (a few degrees, sinusoidal), character idle bob. Respect `prefers-reduced-motion` by disabling drift and particles.

### Color palette (tokens — define once in `src/design/tokens.ts`)
| Token | Hex | Use |
|---|---|---|
| `sunGold` | `#F2B45A` | sunlight, highlights, positive values |
| `cream` | `#F6E7C8` | sky top, UI text on dark |
| `terracotta` | `#D9774B` | buildings, accents |
| `brick` | `#B5533C` | roofs, negative values |
| `sage` | `#9BC27E` | grass, trees |
| `forest` | `#4F8A4B` | dark foliage |
| `skyBlue` | `#7FB3E6` | daytime sky, calm state |
| `dusk` | `#7B6E8F` | evening, walls |
| `ink` | `#2A2420` | dark UI text, window insets |
| `wood` | `#C98F4E` | floors, furniture |
| `stormGrey` | `#6E7480` | crisis-era sky |

Positive/negative finance colors: use `sage`/`sunGold` for "your money goes further" and `brick` for "your money goes less far". Never rely on color alone — always pair with an arrow or text.

### Typography (Google Fonts)
- **Captions / narrative text:** `Cormorant Garamond` *italic* 500–600, large (clamp 28–44px), white `#FFFFFF` with soft text shadow `0 2px 12px rgba(0,0,0,0.35)`, centered over the scene. Example: *"In 2008, the banks began to fail."*
- **HUD labels:** `Cormorant Garamond` 500, ALL CAPS, letter-spacing 0.25em, 13–15px, e.g. `YOUR DOLLAR BUYS`.
- **HUD big numbers:** `Cormorant Garamond` 400, 64–96px, tight line-height. Layout pattern copied from the reference: small caps label above, giant number, small caps label below:
  ```
  ONE U.S. DOLLAR
  0.92
  EUROS TODAY
  ```
- **UI controls (tabs, buttons, slider labels):** `Inter` 500–600, 14–16px.
- HUD sits on the left third of the screen over the scene, no boxes behind it, readable thanks to text shadow. Tabs are a translucent frosted bar at the bottom (`backdrop-filter: blur(12px)`, `rgba(255,255,255,0.18)`, rounded 16px).

### Motion
- Scene transitions: 600–900ms camera fly + fade, eased (`easeInOutCubic`).
- Caption lines fade/slide in word-group by word-group (like the reference videos), 40ms stagger.
- Numbers count up/down smoothly when they change (e.g. moving the timeline slider).

---

## 3. Tech stack (use exactly this unless blocked; explain any deviation)

- **Vite + React 18 + TypeScript** (strict mode).
- **three.js** via **@react-three/fiber** and **@react-three/drei** for 3D.
- **zustand** for global state (player profile, selected city, date, game state).
- **Tailwind CSS** for 2D UI.
- **Recharts** (or lightweight custom SVG) for 2D charts inside tabs, styled to the palette.
- **Vitest** for unit tests (finance math, data parsing, Central Bank model).
- **Node + TypeScript scripts** (`tsx`) for the data pipeline.
- **Blender 4.x + Python (`bpy`)** scripts for generating landmark models as `.glb` (see §7).
- **Hosting:** Vercel or GitHub Pages (static). Public URL, no auth.
- **Scheduled data refresh:** GitHub Actions cron job (see §5).

Project layout:
```
/
├─ CLAUDE.md
├─ README.md                  # how to run, data sources, credits
├─ package.json
├─ public/
│  ├─ data/                   # generated JSON snapshots (committed)
│  └─ models/                 # .glb landmarks exported from Blender
├─ blender/
│  ├─ scripts/                # bpy generators, one per landmark + shared helpers
│  └─ source/                 # .blend files (optional, for manual edits)
├─ scripts/
│  ├─ fetch-fx.ts
│  ├─ fetch-macro.ts
│  ├─ fetch-bigmac.ts
│  ├─ build-dataset.ts        # merges everything into public/data/*.json
│  └─ validate-data.ts        # sanity checks, fails CI on bad data
├─ .github/workflows/refresh-data.yml
└─ src/
   ├─ design/tokens.ts
   ├─ data/                   # typed loaders + types for public/data
   ├─ finance/                # pure functions: conversions, PPP, model
   ├─ game/centralBank/       # model, scenarios, scoring, reducer
   ├─ game/trip/              # stretch mode
   ├─ three/                  # globe, scenes, character, lighting, particles
   ├─ ui/                     # HUD, tabs, slider, panels, onboarding
   └─ App.tsx
```

---

## 4. Cities and currencies (v1 scope: 12 places)

Home currency options in v1 = the currencies of these 12 places. All are covered by the European Central Bank reference rate set, which keeps historical FX data free and consistent back to 1999.

| # | City | Country | Currency | Landmark diorama | Why it's interesting |
|---|---|---|---|---|---|
| 1 | New York | United States | USD | Skyline + yellow cabs | World reserve currency |
| 2 | Paris | France | EUR | Eiffel Tower | Shared currency across 20 countries |
| 3 | London | United Kingdom | GBP | Big Ben + red bus | 2016 Brexit vote, 2022 mini-budget |
| 4 | Tokyo | Japan | JPY | Pagoda + torii gate | Decades of near-zero rates, weak yen 2022–24 |
| 5 | Zurich | Switzerland | CHF | Alps + lake | Safe haven; 2015 peg removal |
| 6 | Istanbul | Türkiye | TRY | Mosque domes + Bosphorus | High inflation, lira collapse |
| 7 | Mexico City | Mexico | MXN | Angel of Independence column | Emerging-market currency, "super peso" |
| 8 | Rio de Janeiro | Brazil | BRL | Sugarloaf mountain + beach | Commodity-linked currency |
| 9 | Mumbai | India | INR | Gateway of India arch | Managed float, large reserves |
| 10 | Seoul | South Korea | KRW | Namsan tower + hills | Export economy |
| 11 | Cape Town | South Africa | ZAR | Table Mountain | Volatile EM currency |
| 12 | Sydney | Australia | AUD | Opera-house-like sail shells + harbour bridge | Commodity currency |

Landmarks are stylized, blocky, and simplified. They should be recognizable but are our own original low-poly models (no downloaded or copyrighted models).

Data model for a place (`src/data/places.ts`, static config):
```ts
type Place = {
  id: string;            // "paris"
  city: string;          // "Paris"
  country: string;       // "France"
  iso3: string;          // "FRA" (World Bank code)
  currency: string;      // "EUR"
  currencyName: string;  // "Euro"
  symbol: string;        // "€"
  lat: number; lon: number;
  sceneId: string;       // which diorama component to load
  palette?: Partial<Record<keyof typeof tokens, string>>; // per-scene tint
};
```

Countries outside the 12 are shown on the globe as low-poly landmass only (not clickable in v1).

---

## 5. Data — sources, pipeline, refresh

**Verify every endpoint and indicator code in Milestone 0 before building on it.** APIs move; if one has changed, find the current equivalent, update this file, and tell the team.

### Sources (all free; none require the viewer to log in)
1. **Exchange rates (daily, current + history since 1999):** Frankfurter API (wraps European Central Bank reference rates; no key; CORS `*`). **Verified 2026-10-20: base URL is `https://api.frankfurter.dev/v1`** (`api.frankfurter.app` now 301-redirects). Use time-series endpoints to pull history in yearly chunks.
   - Store **monthly averages** for history (keeps files small) and **the latest daily rate** separately.
2. **Macro indicators (annual, by country):** World Bank Indicators API v2 (`https://api.worldbank.org/v2/country/{iso3;iso3...}/indicator/{code}?format=json&per_page=20000&date=2000:2026`). No key. Indicators (verify codes):
   - Inflation, consumer prices (annual %): `FP.CPI.TOTL.ZG`
   - GDP growth (annual %): `NY.GDP.MKTP.KD.ZG`
   - Unemployment (% of labor force, modeled ILO): `SL.UEM.TOTL.ZS`
   - Current account balance (% of GDP): `BN.CAB.XOKA.GD.ZS`
   - Total reserves in months of imports: `FI.RES.TOTL.MO`
   - Real interest rate (%): `FR.INR.RINR` — **sparse** (no FRA/TUR; GBR ends 2014, JPN 2017). Fallback: derived `realPolicyRate` = BIS annual-average policy rate − CPI inflation (labelled derived).
   - ~~`PA.NUS.PPPC.RF`~~ is **archived** (WDI Database Archives, source 57) as of 2026-10-20. Replacement, which **powers "what your money buys"**: `priceLevelRatio = PA.NUS.PRVT.PP / PA.NUS.FCRF` (PPP conversion factor for household consumption ÷ official LCU per US$; U.S. = 1). Consumption-based PPP fits "what your money buys" better than GDP-based.
   - Euro-area members (France) share one currency; for EUR-level context use France's country data and note it in the UI ("shown: France").
3. **Big Mac Index:** The Economist's public dataset on GitHub (`output-data/big-mac-full-index.csv`, verified 2026-10-20, latest 2026-07). No France row: use euro area (`EUZ`) for Paris. Used as a fun, intuitive purchasing-power cross-check. Cite it in-app.
4. **Central bank policy rates:** BIS `WS_CBPOL` via SDMX API, verified 2026-10-20: `https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.{US+XM+GB+...}?startPeriod=1999-01&format=csv` (euro area = `XM`). Fetched by `scripts/fetch-policy-rates.ts` → `public/data/policy-rates.json`.

Do **not** scrape cost-of-living websites (terms of service). Everyday-item prices are **model estimates** (see §6.2) and labeled as such.

### Pipeline
- `scripts/fetch-*.ts` download raw data → `scripts/build-dataset.ts` merges and writes compact JSON:
  - `public/data/fx-monthly.json` — `{ base: "EUR", months: ["2008-01", ...], rates: { USD: [...], GBP: [...] } }` (convert to any base client-side via cross rates)
  - `public/data/fx-latest.json` — `{ date, base, rates }`
  - `public/data/macro.json` — `{ [iso3]: { [indicatorKey]: { [year]: number|null } } }`
  - `public/data/bigmac.json`
  - `public/data/policy-rates.json` — BIS monthly policy rates per place
  - `public/data/meta.json` — `{ generatedAt, sources: [{ name, url, coverage, lastObservation }] }`
- `scripts/validate-data.ts` fails loudly if: any of the 12 currencies is missing, a monthly rate jumps > 40% month-over-month without being on an allowlist (e.g. TRY 2018/2021), a macro series is empty for a country, or `fx-latest` is older than 7 days.
- **At runtime** the app loads the committed JSON snapshots (fast, always works), then tries to fetch the latest rates live from Frankfurter. If the live call fails, silently fall back to the snapshot. Show `Data last updated: <date>` in the HUD footer either way.
- **GitHub Action** `refresh-data.yml`: cron daily on weekdays (e.g. `17 21 * * 1-5` UTC, after ECB publication), runs fetch → build → validate, commits changed JSON, which triggers a redeploy. Also `workflow_dispatch` for manual runs.

### Data honesty rules
- Annual World Bank data lags (latest year is often 1–2 years old). Always label the year next to the number: "Inflation 2025: 3.1%".
- Missing data → show "No data" gracefully, never 0.
- Model estimates get a small `≈ estimate` tag with a tooltip explaining the method.

---

## 6. Features and exact behavior

### 6.0 Onboarding (≤ 30 seconds)
1. Title screen: slow-rotating low-poly globe at golden hour, serif italic caption: *"How far does your money really go?"* Button: **Start**.
2. **Make your traveler:** blocky character on a turntable. Choose: skin tone (6 swatches), hair (4 blocky styles), shirt color (6 palette colors). Name field optional. Keep it fast — no other options.
3. **Where are you from?** Pick one of the 12 home countries (cards with flag-free blocky landmark icon + currency code). This sets the **home currency**.
4. **How much are you bringing?** Number input with home-currency symbol, default 1,000. Quick-pick chips: 100 / 1,000 / 10,000.
5. Fly into the globe.

Persist the profile in `localStorage` (wrapped in try/catch; app must work without it).

### 6.1 Globe view
- Low-poly globe (icosphere, detail 3–4, flat-shaded ocean in `skyBlue` with land in `sage`, landmass from a low-res world GeoJSON/TopoJSON baked into vertex colors or as extruded simplified polygons — pick whatever stays blocky and fast).
- Each of the 12 places is a **mini blocky landmark** standing on the globe surface (reuse the scene's landmark at small scale, or a simple glowing block marker if not ready).
- Markers are tinted by **how far the home currency goes there today vs. its 10-year average** (purchasing-power adjusted, see §6.2): gold glow = "goes further than usual", neutral = normal, brick = "goes less far than usual".
- Hover/tap a marker → small floating card: city, `1 USD = 0.92 EUR`, and a one-line hook (e.g. "Your dollar is 18% stronger here than 5 years ago").
- Click → camera flies in, transition to the city scene.
- The player's character stands on top of the globe at their home location.
- HUD (left): `YOU ARE CARRYING` / `$1,000` / `U.S. DOLLARS`.

### 6.2 City scene (the core)
A diorama of the city with the player's character standing in the foreground, facing the landmark. Caption on arrival: *"Paris. Your 1,000 dollars become 920 euros."*

Bottom tab bar with four tabs:

**Tab A — Exchange Rate ("What it's worth")**
- Big HUD number: `ONE U.S. DOLLAR / 0.92 / EUROS TODAY`.
- Below: "Your $1,000 → €920".
- Strength meter: today's rate vs. 10-year average, as a simple horizontal bar and text: "The dollar is 6% stronger than its 10-year average against the euro."
- Inverse shown small: `1 EUR = 1.09 USD`.

**Tab B — What It Buys ("How your money feels there")**
- The key concept: **purchasing power** differs from the exchange rate.
- Compute the **price level index** of destination relative to home:
  `relativePriceLevel = PLR_dest / PLR_home` where `PLR` is World Bank `PA.NUS.PPPC.RF` (latest available year for each).
- "Feels like" value: `feelsLike = amountHome / relativePriceLevel` (in home currency). Copy: "Your $1,000 buys roughly what **$1,350** buys back home." (above 1 = goes further).
- Basket of 6 everyday items, rendered as blocky 3D props popping up in the scene (coffee cup, metro ticket, burger, museum ticket, hotel bed, taxi): price at home is a fixed reference basket defined per home country in `src/finance/basket.ts` (cited, e.g. from national statistics or a documented assumption), and destination price `≈ homePrice × relativePriceLevel`, converted to local currency for display. Tag all as `≈ estimate`.
- Big Mac cross-check card: actual Big Mac price there (from The Economist dataset) in local currency and in home currency, and the index's implied over/undervaluation %. Copy explains the idea in one sentence: "If a Big Mac costs more in dollars here than at home, the Big Mac Index says the local currency may be overvalued."

**Tab C — Timeline ("Through the years")**
- Slider from **Jan 2008 → latest month**, snapping to months. Play button animates through time (≈ 8 seconds total).
- Line chart (home → destination rate) with a moving playhead. Above it the HUD big number updates live.
- **The scene reacts to the slider** (this is a signature feature):
  - Compute `mood` for the selected month = percentile of the home currency's strength vs. destination over the full history (0 = weakest, 1 = strongest).
  - Map mood → lighting: strong = warm `sunGold` sun high, clear sky; neutral = soft daylight; weak = low dusk light, `stormGrey` sky, light rain particles.
  - Map **crisis months** (from `src/data/events.ts`) → special effects: fog thickens, a few blocky figures in the scene huddle, caption appears.
  - Interpolate smoothly between states (lerp colors and light intensity over 400ms).
- **Event markers** on the chart from `src/data/events.ts`. Each event: `{ date, places: ["*"] | ids, title, caption, sourceUrl }`. When the playhead crosses one, show the serif italic caption over the scene for ~3s, e.g. *"September 2008. Lehman Brothers collapses."* Required events (verify each date and fact, cite a source):
  - 2008-09 Lehman Brothers collapse (global)
  - 2010-05 Euro-area sovereign debt crisis / first Greek bailout (EUR)
  - 2015-01 Swiss National Bank removes the franc's minimum exchange rate vs the euro (CHF)
  - 2016-06 UK votes to leave the EU (GBP)
  - 2018-08 Turkish lira crisis (TRY)
  - 2020-03 COVID-19 market shock (global)
  - 2022-03 U.S. Federal Reserve begins raising rates (global)
  - 2022-09 UK mini-budget turmoil (GBP)
  - 2022-10 Yen hits multi-decade low; Japan intervenes (JPY)
  - Add 1–2 more per place where meaningful. Keep each caption ≤ 12 words.

**Tab D — Why ("What moves this currency")**
- Five factor cards for the destination country, each with the latest value, year, a tiny sparkline (last ~10 years), a ▲/▼ "pushes currency up/down" indicator vs. the home country, and a 1–2 sentence plain-English explanation:
  1. **Inflation** — higher inflation erodes a currency's value over time (relative PPP).
  2. **Interest rates** (real rate) — higher real rates attract foreign capital and tend to strengthen a currency (interest-rate differentials / carry).
  3. **Trade balance** (current account % GDP) — persistent deficits require foreign financing and can weigh on a currency.
  4. **Reserves** (months of imports) — buffers a central bank can use to defend its currency.
  5. **Growth & jobs** (GDP growth, unemployment) — stronger economies attract investment.
- A short auto-generated summary from the rules above (deterministic template, not an LLM): "Türkiye's inflation is far above the U.S. level and its real interest rate is negative, both of which have historically pushed the lira down."
- "Learn more" expanders with a 3–4 sentence explanation of each concept and one real example. Keep language at an intro-econ level; no jargon without a definition.

### 6.3 Central Bank mode (the finance game)
Accessible from a top-level **Modes** menu. The player runs a country's central bank/finance ministry for **8 turns (quarters)** during a real historical moment.

**Core lesson to design around:** "the strongest currency" is NOT the goal. A currency that is too strong hurts exporters and jobs; one that is too weak imports inflation. Good policy = **stability**. The game must make the player discover this.

**Scenarios** (`src/game/centralBank/scenarios.ts`). Each scenario is seeded with **real starting values** from `macro.json` / curated sources (cite them) and ends with a **"What really happened"** reveal (3–5 sentences, factual, sourced). v1 scenarios:
1. **Switzerland, 2014–15: "The Safe-Haven Problem."** Money floods into the franc; exporters suffer; you hold a cap vs. the euro by printing francs and buying euros. Reveal: Jan 2015 removal of the floor.
2. **Türkiye, 2018: "The Lira Slide."** High inflation, large current-account deficit, falling currency. Reveal: lira crisis and the large September 2018 rate hike.
3. **United Kingdom, 2022: "Market Revolt."** Unfunded fiscal announcement, gilt and pound selloff. Reveal: Bank of England emergency bond purchases and policy reversal.
4. **Japan, 2022: "The Weak Yen."** Rates near zero while the U.S. hikes fast. Reveal: yen at multi-decade low, Japan's FX intervention.
5. *(Bonus, curated data)* **United Kingdom, 1992: "Black Wednesday."** Defending the pound in the ERM. Reveal: UK exit from the ERM. If historical data is hard to source cleanly, ship scenarios 1–4 first.

Every factual statement in scenario intros and reveals must be checked against a reputable source and the URL stored in the scenario object.

**Levers per turn** (UI: four blocky physical controls on a desk in a "central bank office" diorama, plus accessible sliders):
- **Policy interest rate:** change by −2.00 to +2.00 percentage points in 0.25 steps (floor −1.0%, cap 50%).
- **Money printing (QE / deficit financing):** None / Some / Lots (0, 1, 2).
- **Currency intervention:** Sell reserves to support currency (0–3 levels) **or** buy foreign currency to weaken it (0–3 levels). One direction per turn.
- **Tariffs / capital controls:** None / Light / Heavy (0, 1, 2).

**Random events** per turn (probability 30%, scenario-weighted): global recession, oil price spike, investor panic (capital flight), export boom, credibility shock (e.g. political pressure on the central bank). Each event has a caption in the serif italic style and fixed numerical shocks.

**Model** — a deliberately simplified *teaching* model, not a forecast. All coefficients live in `src/game/centralBank/config.ts` so we can tune them. Units: rates and growth in %, FX index `fx` where 100 = scenario start and higher = stronger home currency.

State: `inflation, policyRate, growth, unemployment, fx, reserves (months of imports), debtToGdp, credibility (0–100), approval (0–100)`. Scenario provides `worldRate, worldInflation, potentialGrowth, neutralRealRate, inflationTarget (default 2), naturalUnemployment`.

Each turn (quarter), with `realRate = policyRate − inflation` and `worldReal = worldRate − worldInflation`, `credFactor = 0.5 + credibility/200`:
```
fxChange% = credFactor * 1.2 * (realRate − worldReal) / 4
          − 3.0 * print
          + 2.5 * interveneSupport − 2.5 * interveneWeaken
          − 0.08 * max(0, debtToGdp − 60)
          + 0.4 * currentAccountPct / 4
          + eventFxShock + noise(σ = 1.5)
fx      *= (1 + fxChange%/100)

inflation' = inflation
           + 0.25 * (growth − potentialGrowth)
           + 1.2 * print
           − 0.20 * (realRate − neutralRealRate)
           − 0.10 * fxChange%          // weaker currency → imported inflation
           + 0.6 * tariffs
           + eventInflationShock
growth'    = potentialGrowth
           − 0.35 * (realRate − neutralRealRate)
           + 0.4 * print
           − 0.05 * fxChange%          // stronger currency → hurts exports
           − 0.5 * tariffs
           + eventGrowthShock
unemployment' = unemployment − 0.1 * (growth' − potentialGrowth)   // Okun-style, quarterly; clamp 2–30
reserves'  = reserves − 0.6 * interveneSupport + 0.4 * interveneWeaken + eventReserveShock
debtToGdp' = debtToGdp + 0.8 * print + max(0, policyRate − growth') * 0.1
credibility' = credibility − 8 * print − 6 * (|inflation' − target| > 5 ? 1 : 0)
             + 4 * (|inflation' − target| < 1.5 ? 1 : 0) − 10 * (reserves' < 1 ? 1 : 0)
approval'  = clamp(100 − 4 * max(0, inflation' − 3) − 5 * max(0, unemployment' − natural)
             − 3 * max(0, policyRate − 8), 0, 100)
```
Clamp all values to sane ranges. **If reserves fall below 0.5 months → forced devaluation event**: `fx *= 0.75`, credibility −25, caption *"Reserves run dry. The currency breaks."* Use a seeded RNG (seed shown in results) so runs are reproducible for testing and for the PDF.

These formulas are a starting point. Write Vitest tests that check the **directions** are economically sensible (higher real rate → stronger fx and lower inflation and lower growth; printing → weaker fx and higher inflation; support intervention → stronger fx and lower reserves; tariffs → higher inflation and lower growth) and that no state goes NaN/Infinity over 1,000 random playthroughs. Tune coefficients until a "do nothing" run produces a plausible-looking scenario path.

**Scoring (0–100 per turn, averaged):**
```
score = 30 * stabilityScore      // 1 − min(1, |fxChange%| / 8)
      + 30 * inflationScore      // 1 − min(1, |inflation − target| / 8)
      + 20 * jobsScore           // 1 − min(1, max(0, unemployment − natural) / 6)
      + 10 * reservesScore       // min(1, reserves / 6)
      + 10 * approval/100
```
Final grade A–F. The results screen shows: grade, a chart of each state variable over 8 turns vs. the real historical path where we have data, the seed, and **"What really happened"** reveal. One-line lesson at the end, e.g. *"You defended the franc — and it cost you 40% of your reserves."*

**Scene:** a blocky central bank office diorama (wood desk, big window onto the country's city, chart on a wall that updates). The view out the window reflects the economy: busy streets and sun when healthy, empty streets and rain when in crisis (reuse city props).

### 6.4 Trip mode (STRETCH — only after 6.0–6.3 are solid)
"You have **$3,000** (in home currency) and **21 days**. Visit as many places as you can without running out of money."
- Each place has a daily cost = `homeDailyCost × relativePriceLevel` (home daily cost defined per home country in `basket.ts`, labeled estimate). Flights between places = flat cost by distance band.
- Player picks a route on the globe, chooses days per stop (min 2). Stamps collected in a blocky passport.
- Score = places visited × 100 + leftover money bonus. Results screen explains which stops stretched their money and why (link to Tab B concept).
- Option to set the trip in a past year (uses that year's rates and price levels) — "Backpack Europe in 2011 vs 2025."

### 6.5 Persistent UI elements
- Top-left: app name. Top-right: **Modes** (Explore / Central Bank / Trip), **Data** (opens Data Sources panel), sound toggle (optional ambient music off by default), **About**.
- **Data Sources panel:** every source with name, link, coverage, last observation date, and `meta.generatedAt`. Also explains what is an estimate and how it's computed. This is required for the grade.
- **About panel:** one paragraph on the project, team names, course, "built with Claude Code", and a short disclaimer: educational tool, simplified model, not financial advice.
- Bottom-right: `Data last updated <date>`.

---

## 7. 3D assets — Blender pipeline + procedural fallback

Two ways to make models; both are valid. **Never block progress on art.**

1. **Procedural in code (default for v1):** build props, people, trees, buildings, and simple landmarks directly from box/cylinder/cone geometry in React Three Fiber components under `src/three/props/`. Use `InstancedMesh` for repeated items (windows, crops, crowds).
2. **Blender, scripted:** for hero landmarks (Eiffel Tower, Big Ben, Sydney sails, Gateway of India, etc.), write **Python `bpy` scripts** in `blender/scripts/` that build the model entirely from cubes/cylinders, assign flat-colored materials using the palette tokens, apply a bevel of 0 (hard edges), and export `.glb` to `public/models/` with:
   ```bash
   blender --background --python blender/scripts/make_eiffel.py -- --out public/models/eiffel.glb
   ```
   Share helpers in `blender/scripts/blocky.py` (e.g. `add_box(name, size, location, color)`, `stack_boxes(...)`, `export_glb(path)`). Keep each landmark ≤ 5,000 triangles. Origin at the base center; +Y up in three.js after export (verify axes once).
   - The team can also open the generated `.blend` files and edit by hand in Blender's GUI, then re-export. Document the export settings in `blender/README.md`.
   - Load with drei `useGLTF`, preload on hover of the globe marker.

Character (`src/three/Character.tsx`): procedural boxes, props for colors/hair, animations done in code: idle bob, walk cycle (leg/arm swing), wave on arrival, "huddle" pose for crisis moments.

Performance budget: ≤ 60k triangles per scene, ≤ 150 draw calls, shadows only from the sun, textures none. Lazy-load each city scene (`React.lazy`) so the initial bundle stays small.

---

## 8. Milestones (today is Tue Oct 20, 2026; deadline Tue Nov 3, 1pm)

Work milestone by milestone. At the end of each: run tests, run the app, take screenshots into `docs/screenshots/`, commit with a clear message, and write a 3-line entry in `docs/BUILD_LOG.md` (what was built, what we expected, what actually happened). The build log feeds the final PDF and the team's portfolio case study.

- **M0 — Setup & data spike (Oct 20–21).** Scaffold the Vite/R3F/TS/Tailwind project. Verify every data endpoint in §5 and write `fetch-*` scripts. Produce real `public/data/*.json`. Write `validate-data.ts`. *Done when:* `npm run data` produces validated JSON for all 12 places and `npm run dev` shows a blank styled canvas with fonts loaded.
- **M1 — Look & feel (Oct 21–23).** Lighting rig, sky gradient, fog, particles, design tokens, typography, caption component, HUD big-number component, the blocky character, and **one complete city scene (Paris)**. *Done when:* a screenshot of Paris is recognizably in the reference style.
- **M2 — Globe + navigation + onboarding (Oct 23–25).** Globe with 12 markers, hover cards, fly-in transition, onboarding flow, profile persistence. *Done when:* a new user can go from title → character → home currency → globe → Paris.
- **M3 — City tabs (Oct 25–27).** Tabs A–D fully working with real data for all 12 places (scenes for the other 11 can be simpler at first: generic blocky city + their landmark). Timeline slider drives scene mood and events. *Done when:* every number has a source in the Data panel and Vitest covers conversions, cross rates, PPP math.
- **M4 — Central Bank mode (Oct 27–30).** Model + tests, 4 scenarios with sourced reveals, office scene, results screen. *Done when:* model direction tests pass and a playtester can finish a scenario in ≤ 6 minutes.
- **M5 — Polish, deploy, refresh job (Oct 30–Nov 1).** Remaining landmark models, performance pass, mobile layout, reduced-motion, GitHub Action live, public deploy. Playtest with 5 classmates; fix the top 3 confusions.
- **M6 — Submission (Nov 1–2).** Draft the PDF content in `docs/submission.md` (see §10). Leave Nov 2 evening and Nov 3 morning as buffer. **Submit by Nov 3, 11:00am — not 12:59pm.**
- **Stretch (only if ahead):** Trip mode, more scenarios, more cities.

If behind schedule, cut in this order: Trip mode → bonus 1992 scenario → hand-built landmarks for the last cities (use generic city) → post-processing. Never cut: data refresh, Data Sources panel, Tabs A–D, at least 2 Central Bank scenarios.

---

## 9. Working rules for Claude Code

- Before each milestone, restate the plan in a few bullets and list files you will touch. Then build.
- Keep finance math in **pure, tested functions** in `src/finance/` and `src/game/` — no math inside React components.
- Never invent data. If a number isn't available from a source, show "No data" and note it in `docs/BUILD_LOG.md`.
- Never put secrets or API keys in the client bundle. All data fetches at runtime must be to keyless public endpoints or our own static JSON.
- Ask before adding a new dependency not listed in §3, and before changing the visual style.
- Prefer small, reviewable commits. Don't refactor unrelated code.
- Accessibility: all interactive 3D objects also have an equivalent HTML control; tab order works; text contrast ≥ 4.5:1 (captions rely on shadow — verify against the brightest sky).
- When something visual is done, describe how to check it ("open /, click Paris, drag slider to 2015") so a teammate can verify.
- Keep this file up to date when decisions change (add a "Decisions" entry at the bottom with date and reason).

---

## 10. Final submission (PDF) — content checklist
Generated as `docs/submission.md`, then exported to PDF by the team. Must include:
1. Title, team members, course, date.
2. **Public live link** (clickable) and GitHub repo link (public). Confirm both open in a private browser window with no login.
3. One-paragraph pitch and the problem it solves.
4. Screenshots: title, globe, Paris tabs A–D, timeline at two different years (showing the mood change), Central Bank scenario + results.
5. **How it meets the requirements:** historical data import (sources + date ranges) and automatic updates (GitHub Action schedule, `Data last updated` stamp).
6. Finance content: the purchasing-power method, the Why-tab factor logic, and the Central Bank model equations with their economic intuition and stated limitations.
7. How AI (Claude Code) was used: workflow, what the team decided vs. what was generated, and how numbers were verified.
8. Data sources and citations.
9. Limitations and next steps.

---

## 11. Team roles (fill in names)
- **Product lead / PM:** owns this spec, priorities, playtests, build log, PDF. — ____
- **Design lead:** visual style, Figma mockups of HUD/tabs, Blender landmarks, screenshots. — ____
- **Finance lead:** data correctness, Why-tab explanations, Central Bank model tuning, scenario fact-checking. — ____
- **Engineering lead:** drives Claude Code, repo, deploy, data pipeline. — ____

---

## Decisions
- 2026-10-20: Chose 12 ECB-covered currencies for v1 to guarantee free, consistent historical FX data back to 1999.
- 2026-10-20: Everyday-item prices are PPP-based estimates (no scraping); Big Mac Index used as a real-price cross-check.
- 2026-10-20 (M0): Frankfurter base URL → `api.frankfurter.dev/v1`. `PA.NUS.PPPC.RF` archived → derive price level ratio as `PA.NUS.PRVT.PP ÷ PA.NUS.FCRF`. `FR.INR.RINR` gaps → BIS policy rates integrated (API, not hand-curated) with derived real policy rate. Big Mac uses euro area for Paris. Pinned TypeScript 5.9 (not TS 7) and three 0.170 for drei 9 / React 18 compatibility. Node 24 LTS installed to `~/.local/node`.
