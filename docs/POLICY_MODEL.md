# Policy & Regulatory Risk

The policy module connects a manually curated federal / state source catalog to the existing public-data portfolio. Source snapshot: 2026-09-14. The underlying asset snapshot is unchanged.

## Coverage

Four initial records: FERC Order 2023 / 2023-A; Virginia Code § 56-585.5; Texas SB 6 enrolled text; California SB 100 policy. The exact official source URLs, source-specific review dates, documented facts, interpretation, legal/source status, effective-date limitations, and suggested next steps are stored in `data/policies.json`.

Reviewing one named source does not establish that all subsequent amendments, litigation, tariff approvals or implementing rules have been checked. Texas is explicitly recorded as enrolled text reviewed, not a verified current implementation status. Unknown effective dates remain null. A policy target year is never used as its effective date. The module prompts refresh after 30 days; it does not automatically retrieve updates.

Utility-specific tariffs, permitting rules, other jurisdictions, and comprehensive federal policy coverage remain outside this initial catalog. Policy status is independent of the review action status. No automated legal advice, financial impact estimate or approval is produced.

## Mapping

- FERC: non-operating assets outside ERCOT are candidate generator-queue reviews. Provider tariff jurisdiction and queue stage remain unverified. Operating assets and ERCOT-only generation are excluded from this candidate rule. Unknown or mixed ERCOT jurisdiction is unresolved.
- State policy: explicit state matches are geographic context only. Unknown and multi-state assets remain unresolved instead of being allocated across states.
- Texas large-load policy: Texas generation is supply context only. Generation MW and announced compute capacity cannot prove electrical customer load, applicability thresholds or qualifying service requests.
- No assets are invented to populate Virginia or California views. A zero match means no match in the selected dataset, not no regulatory exposure.
- Portfolio scope, market, technology and risk filters apply to asset mapping. The policy-jurisdiction selector filters the catalog separately.
- Candidate capacity includes only normalized MWac and counts each asset once. Unknown capacity is excluded, not treated as zero exposure. State-context and unresolved links do not enter candidate MWac. No compliance finding is inferred, and the existing health score is unchanged.

## Workflow

Use the Policy & Regulatory Risk navigation link. Open a record to see facts, potential impact, source, status, dates, asset links and the suggested review action. Asset links open the existing asset detail dialog, which also includes policy context. The overview links to policy review.

Owners, due dates, action status and evidence are saved in this browser only. Reviewed actions require evidence. Suggested functional owners are not actual company assignments. A reviewed action neither resolves the legal question automatically nor changes the source status. Export the filtered policy brief to share the source record, asset associations and saved review notes. Review due dates are user-selected workflow dates, not statutory deadlines.

## Checks

Run `node scripts/test-policy.cjs`, `python3 scripts/validate.py`, `node scripts/test-integration.cjs`, and `node scripts/test-ai-context.cjs`. Serve with the existing static server workflow. No new dependencies or service credentials are required.
