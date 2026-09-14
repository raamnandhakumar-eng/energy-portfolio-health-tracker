# Energy Portfolio Health Tracker

A public-data **energy portfolio control room** built to explore how an energy integration team could connect portfolio health, delivery risk, data quality, cross-functional actions, procurement readiness, and AI-assisted reporting in one operating view.

[**Live app → energy-portfolio-health-tracker-seven.vercel.app**](https://energy-portfolio-health-tracker-seven.vercel.app/)

> Independent public-data learning project. Not affiliated with or endorsed by any company. No internal company data is used.

## What the control room does

The first screen is designed around a portfolio review rather than a generic dashboard.

- **Portfolio pulse:** health score, delivery exposure, unresolved COD, data confidence, and management focus.
- **Delivery view:** market capacity, firmness scenarios, delivery-risk causes, lifecycle status, and disclosed COD timing.
- **Exception queue:** surfaces the highest-impact assets with risk or data gaps.
- **Integration review:** assigns functional owners, due dates, status, evidence, and decision notes to open issues.
- **Procurement readiness:** makes cross-team evidence gates explicit across Analytics, Asset Management, Wholesale, Origination, Infrastructure, and Finance.
- **Leadership brief:** converts the applied portfolio view into an executive-ready situation, exposure, priority handoff, decision request, and next forum.
- **Scenario review:** stress-tests delivery timing with 0–3 year delays to flagged development assets.
- **Saved review comparison:** compares health, capacity, COD, and risk changes against a browser-local baseline.
- **Policy & Regulatory Risk:** four official-source records covering federal generator interconnection, Virginia, Texas and California; portfolio screening links, source dates, browser-local review actions and downloadable policy briefs. [Coverage and mapping rules](docs/POLICY_MODEL.md).
- **Decision brief export:** downloads a review record with assumptions, actions, evidence requirements, and source lineage.

## Free AI analyst

The app includes an optional local AI workflow for:

- drafting a leadership brief,
- explaining priority risks,
- suggesting cross-functional handoffs.

Qwen2.5 1.5B runs locally through WebLLM in a Web Worker. No API key or per-request model charge is required. The model receives calculated portfolio facts and a small set of prioritized asset rows. It cannot change data, close actions, or approve procurement decisions.

Compact models can hallucinate. Every AI output should be checked against the supplied source assets.

## Current case study

The current dataset uses public disclosures from a hyperscale data-center energy portfolio as the first case study.

The framework is company-agnostic. The same schema can support public-data modules for other hyperscalers, utilities, developers, and large data-center operators.

## Core portfolio metrics

- normalized contracted/disclosed MWac,
- low/base/high firmness screening,
- expected generation where defensible,
- regulatory, interconnection, and construction exposure,
- unresolved COD,
- lifecycle status,
- counterparty concentration,
- market concentration,
- asset-level data confidence,
- source lineage.

The project intentionally preserves unknown values instead of manufacturing precision.

## Data discipline

Read `docs/DATA_MODEL.md` for the entity definitions, grain, units, assumptions, source families, formulas, refresh logic, and known limitations.

Important rules:

- MWdc and MWac are never added together.
- Expected generation is separate from firm-capacity contribution.
- Firmness is a screening scenario, not ELCC, UCAP, or ISO-accredited capacity.
- Public compute or campus-scale announcements are not treated as electrical peak load unless explicitly disclosed.
- Annual load matching cannot be reconstructed defensibly without internal load, settlement, allocation, curtailment, and REC/EAC data.

## Public source families

The model uses public company and utility announcements, EIA data, NREL references, ISO/RTO interconnection information, and relevant regulatory materials where available. Source URLs are retained at the asset level.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Validate the dataset

```bash
python3 scripts/validate.py
```

The validator checks required fields, unit normalization, risk labels, duplicate-count controls, and portfolio-data consistency.

## Repository structure

```text
.
├── index.html
├── styles.css
├── portfolio-monitor.css
├── app.js
├── portfolio-pulse.js
├── portfolio-monitor.js
├── integration-review.js
├── procurement-review.js
├── local-ai.js
├── ai-context.js
├── data-loader.js
├── data/
├── docs/
├── scripts/
├── vercel.json
├── CHANGELOG.md
└── LICENSE
```

## Interview framing

> “I built this as an energy portfolio operating-system prototype, not just a dashboard. The goal was to connect source data, delivery exposure, owners, evidence, review cadence, procurement gates, and executive communication in one decision workflow.”

## License

MIT. See `LICENSE`.
