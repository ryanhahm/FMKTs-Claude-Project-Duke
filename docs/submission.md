# Coin Atlas — How far does your money really go?

**FMKT 256 Extra Credit Project on AI · Prompt #1: "Build a finance app" · Duke University, Fall 2026**
**Team:** _[Name — Product lead]_, _[Name — Design lead]_, _[Name — Finance lead]_, _[Name — Engineering lead]_
**Date:** November 3, 2026

**Live app (no login):** https://ryanhahm.github.io/FMKTs-Claude-Project-Duke/
**Source code (public):** https://github.com/ryanhahm/FMKTs-Claude-Project-Duke

> _Before exporting: confirm both links open in a private/incognito window, fill in team names, and swap in the final screenshots listed in §4._

---

## 1. Pitch

Coin Atlas is a browser game that teaches international finance through a low-poly 3D world. You make a small blocky traveler, choose your home country and how much money you're bringing, then fly around a globe of 12 cities. In each city you see what your money is worth (the exchange rate), what it actually buys (purchasing power), how that changed since 1999 — the scene's weather follows your currency's strength — and why the currency is where it is (inflation, real interest rates, trade, reserves, growth). In **Central Bank mode** you run a central bank through a real currency crisis — Switzerland 2015, Türkiye 2018, the UK mini-budget 2022 or Japan's weak yen 2022 — using real starting data, and then see what actually happened. A short guided tour on first arrival (replayable from the globe's **Tour** button) walks through every view in about a minute.

**The problem it solves:** exchange rates are everywhere in the news but almost nobody can say what "the dollar is strong" means for them. Most people confuse a currency's price with its purchasing power, and assume a stronger currency is always better. Coin Atlas makes those ideas concrete and personal ("your $1,000 feels like about $1,650 in Mexico City") and lets players discover that good monetary policy is about stability, not strength.

## 2. Screenshots

_(Files in `docs/screenshots/`.)_
1. Title screen — `m2-title-mobile.jpg`
2. Globe with city markers and hover card — `m2-globe-card.jpg`
3. Paris, Tab A "What it's worth" — `m3-istanbul-tab-a.jpg` (Istanbul shown) / Paris equivalent
4. Paris, Tab B "What it buys" — `m3-paris-tab-b-buys.jpg`
5. Timeline at two dates: September 2008 (stormy) — `m3-paris-timeline-2008-storm.jpg`; March 2015 (sunny) — `m3-paris-timeline-2015-sunny.jpg`
6. Paris, Tab D "Why" — `m3-paris-tab-d-why.jpg`
7. Central Bank scenario in play — `m4-central-bank-play.jpg`; results — `m4-central-bank-results.jpg`
8. Other cities — `m3-tokyo.jpg`, `m3-london.jpg`, `m3-sydney.jpg`, `m3-mumbai.jpg`, `m3-zurich.jpg`

## 3. How it meets the requirements

**Imports historical data.**

| Data | Source | Coverage |
|---|---|---|
| Exchange rates (12 currencies) | European Central Bank euro reference rates, via the Frankfurter API | Daily since Jan 1999; stored as monthly averages + latest daily rate |
| Inflation, GDP growth, unemployment, current account, reserves, PPP conversion factor, official exchange rate | World Bank World Development Indicators API | Annual, 1999–2025 |
| Central bank policy rates | Bank for International Settlements (WS_CBPOL) | Monthly since 1999 |
| Big Mac prices | The Economist, Big Mac Index (GitHub) | Semi-annual since 2000 |

**Updates automatically when new data become available.** A GitHub Actions job runs every weekday at 21:17 UTC (after the ECB publishes): it downloads all four sources, rebuilds the datasets, runs a validator (fails if a currency is missing, a month jumps >40%, a series is empty, or rates are older than 7 days) and commits the new data. Every data commit triggers a rebuild of the public site. It has run successfully every weekday since October 27. In the app, the bottom-right shows **"Data last updated …"** and the ECB date, and the browser also fetches today's ECB rates live (falling back to the saved snapshot if that fails). The **Data** panel lists every source, its coverage, last observation and every estimation method.

**No login, no keys.** All sources are public and keyless; the site is static.

## 4. The finance

### 4.1 Exchange rates and cross rates
All rates are ECB quotes in euros; any pair is computed through the euro: rate(home→dest) = rate(EUR→dest) ÷ rate(EUR→home). Tested for reciprocity and transitivity (no triangular arbitrage).

### 4.2 "Goes further than usual" — the real exchange rate
Globe markers compare today with the last 10 years **after inflation**:
q = S × P_home ÷ P_dest (S = destination currency per unit of home currency, P = consumer price index built from World Bank annual inflation, interpolated monthly). Strength = q_today ÷ average(q over 10 years) − 1.
This matters: for a U.S. traveler the Turkish lira looks **173% cheaper** than its 10-year average in nominal terms, but after inflation the dollar actually goes **~10% less far** in Istanbul. The nominal number would have taught the wrong lesson.

### 4.3 Purchasing power ("What it buys")
The World Bank PPP conversion factor for household consumption (PA.NUS.PRVT.PP) tells how many units of local currency buy what $1 buys in the U.S. Dividing by today's market rate gives the price level relative to the U.S.; the ratio destination/home is the relative price level, and **"feels like" = amount ÷ relative price level**. (The World Bank's ready-made price-level ratio PA.NUS.PPPC.RF has been archived, so we derive it.) Everyday basket prices are **model estimates**: a single U.S. reference basket (documented team assumptions) × each country's PPP factor; the Big Mac row uses real Economist prices instead. The Big Mac check reports the index's implied over/undervaluation. A nice teaching tension: Paris is ~18% cheaper than the U.S. on PPP, yet the euro looks ~11% *overvalued* by the Big Mac standard — different baskets, different answers.

### 4.4 Timeline mood
The selected month's exchange rate is ranked against every month since 1999 (percentile). Strong months render as sunny, weak months as stormy with rain; 22 sourced historical events (the euro launch, Türkiye 2001, Lehman, the Greek bailout, the SNB floor, Brexit, the lira crisis, COVID, Fed hikes, the UK mini-budget, Japan's intervention…) add captions, fog and huddling crowds.

### 4.5 Investing abroad: the carry trade and uncovered interest parity
The timeline's **"Invest there"** view asks: if you had moved your money into the destination currency at any month since 1999, earned its short-term interest rate (BIS policy rate as the proxy, compounded monthly) and converted back today, would you beat keeping it at home? The result is split into interest earned and the currency effect, annualised, with the worst peak-to-trough drawdown. **Uncovered interest parity** predicts the high-rate currency should weaken just enough to cancel the extra interest. Real data shows both outcomes: $1,000 put into Turkish lira in January 2010 earned +1,374% in interest but lost 97% on the currency, ending at **$439** (vs **$1,293** in U.S. rates); the same trade in Mexican pesos ended at **$1,945** — UIP failed and the carry trade paid, but with a 35% drop along the way. No taxes, fees or spreads; past returns don't predict future ones.

### 4.6 "Why" — five factors
For the destination vs home, using the latest World Bank year (shown): inflation higher by >1pt → ▼; real interest rate (BIS policy rate − CPI inflation) higher by >1pt → ▲; current account weaker by >2pt of GDP → ▼; reserves <3 months of imports → ▼, >6 → ▲ (ignored for free-floating major currencies, whose central banks rarely defend the exchange rate); GDP growth higher/lower by >1pt → ▲/▼. A deterministic template turns these into a plain-English summary (no LLM). We chose policy rate − CPI over the World Bank's real interest rate because the latter is lending-rate based and not comparable across countries (it shows ~37% for Brazil).

### 4.7 Central Bank model (teaching model, not a forecast)
State: inflation, policy rate, growth, unemployment, currency index (100 = start), reserves (months of imports), new debt, credibility, approval. One turn = one quarter, eight turns. Real rate r = policy rate − expected inflation, where expected inflation = credibility-weighted mix of the target and current inflation.

- **Currency change** = 1.2·credFactor·(r − r_world)/4 − 3·print ± 2.5·intervention − 0.15·newDebt + 0.4·CA/4 + background pressure + events + noise(σ=1.5)
- **Inflation'** = inflation + 0.25·(growth − potential) + 1.2·print − 0.2·(r − r*) − 0.1·Δcurrency + 0.6·tariffs + 0.3·weaken + 0.2·credibility·(target − inflation) + events
- **Growth'** = potential − 0.35·(r − r*) + 0.4·print − 0.05·Δcurrency − 0.5·tariffs + events; unemployment follows via Okun's law
- **Reserves** fall when supporting the currency; below 0.5 months the currency is forcibly devalued 25%.
- **Score** per quarter = 30% currency stability + 30% inflation near target + 20% jobs + 10% reserves + 10% approval → grade A–F.

**Intuition:** higher real rates attract capital (stronger currency) but cool inflation and growth; printing money weakens the currency and raises inflation; defending a currency burns reserves; a weaker currency imports inflation while a stronger one hurts exporters.
**Grounding:** starting values come from World Bank and BIS data; the "world" interest rate each quarter is the partner central bank's actual BIS path (the Fed's 2022–23 hikes, the ECB's zero rates). After tuning, doing nothing in Türkiye reproduces history closely (lira −28 to −34% vs −36% actual; inflation ~21–25% vs a ~25% peak).
**Tuning we had to do (documented):** with a fixed policy rate the brief's original equations were explosive (UK inflation to 50%, deflation spirals in Switzerland). We added textbook features: expectations anchored by credibility, saturating real-rate effects, and "new debt" instead of debt levels (no comparable debt source for all four countries).
**Tests:** every lever moves the economy in the economically sensible direction; 1,000 random playthroughs never produce invalid values; runs are reproducible from a seed.

## 5. How we used AI (Claude Code)

- **Workflow.** The team wrote a detailed brief (`CLAUDE.md`: requirements, visual style, data sources, model, milestones). Claude Code built milestone by milestone, restating the plan first, then running tests, taking screenshots, committing, and writing a 3-line entry in `docs/BUILD_LOG.md` (what we built / expected / what actually happened).
- **What the team decided:** the concept, the 12 cities, the visual style, the scoring weights, which trade-offs to accept, and every judgment call recorded in CLAUDE.md "Decisions" (e.g. policy rate − CPI for real rates; inflation-adjusted globe colors; GitHub Pages; what to cut when behind schedule).
- **What was generated:** the code (data pipeline, 3D scenes built from code-generated boxes, UI, model, tests), first drafts of explanations and scenario texts, and this document's first draft.
- **How numbers were verified:** every API endpoint and indicator code was checked live before use (two had changed: the Frankfurter URL and an archived World Bank series). A validator runs on every data refresh. Every event and scenario source URL was checked to resolve, every event was checked against the exchange-rate data, our monthly exchange rates were cross-checked against the ECB’s official monthly averages (identical to rounding), and factual claims were checked against the source text or our own datasets (e.g. "the lira lost ~36% Jan–Aug 2018" was computed from ECB data). Finance math lives in pure functions with 95 unit tests.
- **Where AI got it wrong (and we caught it):** the nominal "strength" measure misled for high-inflation currencies; the first reserves rule flagged the UK and Australia as "thin reserves"; the original model equations were unstable; a timeline caption rendered behind the chart. Each is logged in the build log with the fix.

## 6. Data sources and citations

- European Central Bank euro foreign exchange reference rates, via Frankfurter — https://frankfurter.dev
- World Bank, World Development Indicators API — https://data.worldbank.org (FP.CPI.TOTL.ZG, NY.GDP.MKTP.KD.ZG, SL.UEM.TOTL.ZS, BN.CAB.XOKA.GD.ZS, FI.RES.TOTL.MO, FR.INR.RINR, PA.NUS.PRVT.PP, PA.NUS.FCRF)
- Bank for International Settlements, central bank policy rates — https://data.bis.org/topics/CBPOL
- The Economist, Big Mac Index — https://github.com/TheEconomist/big-mac-data
- Natural Earth 1:110m land (public domain) — https://www.naturalearthdata.com
- Event and scenario sources (each linked in the app): Federal Reserve History (Lehman); Swiss National Bank press releases (6 Sep 2011, 15 Jan 2015); ECB (Draghi speech 26 Jul 2012; asset purchases 22 Jan 2015); Bank of Japan (4 Apr 2013); Federal Reserve (testimony 22 May 2013; FOMC statements 15 Mar 2020, 16 Mar 2022); Bank of England (gilt operation, 28 Sep 2022); Reserve Bank of Australia (Nov 2020); Japan Ministry of Finance (FX interventions); Wikipedia overview articles for the Greek debt crisis, Brexit referendum, Turkish currency crisis, Brazilian 2014 crisis, Nhlanhla Nene, the 2022 UK mini-budget, and the Japanese yen.

## 7. Limitations and next steps

- **Annual data lags.** World Bank data runs 1–2 years behind (labelled with the year everywhere); where a year is missing, inflation is carried forward and flagged in the Data panel.
- **Estimates.** Everyday prices are PPP-based estimates from one U.S. reference basket, not surveyed city prices; national price levels hide big city differences (Paris vs rural France).
- **Teaching model.** The Central Bank model is simplified and partly tuned by hand; background pressures and structural parameters (potential growth, neutral rate) are assumptions, not estimates.
- **Euro area.** Represented by France's data and the euro-area Big Mac price.
- **Next steps:** hand-built hero landmarks (Blender), the central-bank office scene, Trip mode ("backpack Europe in 2011 vs 2025"), the 1992 Black Wednesday scenario, more cities, and city-level price data from an open, permitted source.
