# Coin Atlas

How far does your money really go? A low-poly 3D explorer of exchange rates, purchasing power, inflation and monetary policy. FMKT 256 (Duke, Fall 2026). See `CLAUDE.md` for the full brief.

## Run
Requires Node 24+.
```bash
npm install
npm run data   # fetch → build → validate public/data/*.json
npm run dev    # http://localhost:5173
npm test
```

## Data sources (all free, keyless)
| Data | Source | Notes |
|---|---|---|
| Exchange rates | ECB euro reference rates via [Frankfurter](https://frankfurter.dev) (`api.frankfurter.dev/v1`) | Daily since 1999; stored as monthly averages + latest daily |
| Macro indicators | [World Bank WDI API v2](https://data.worldbank.org) | `FP.CPI.TOTL.ZG`, `NY.GDP.MKTP.KD.ZG`, `SL.UEM.TOTL.ZS`, `BN.CAB.XOKA.GD.ZS`, `FI.RES.TOTL.MO`, `FR.INR.RINR`, `PA.NUS.PRVT.PP`, `PA.NUS.FCRF` |
| Price level ratio | Derived: `PA.NUS.PRVT.PP ÷ PA.NUS.FCRF` | Replaces archived `PA.NUS.PPPC.RF` |
| Big Mac Index | [The Economist big-mac-data](https://github.com/TheEconomist/big-mac-data) | Euro area used for Paris |
| Policy rates | [BIS WS_CBPOL](https://data.bis.org/topics/CBPOL) | Real policy rate = policy − CPI inflation (derived) |

Data refreshes automatically on weekdays via `.github/workflows/refresh-data.yml`.
