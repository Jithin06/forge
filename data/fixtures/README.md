# Fixtures

Fixture mode (`AI_PROVIDER=fixture`) reads `ask/`, `plan/` and `scrap/`. Any screen built from them shows a "Sample data" banner.

- `ask/` and `plan/` for the phone stand, the night light, the club sign, the vague idea and the blocked idea are **recordings of the live model**, written by `npm run check:quality`. Each file says when it was recorded.
- `ask/default.json`, `plan/default.json`, `plan/vague.json` and `scrap/default.json` are hand-written. The defaults are what fixture mode returns for an idea it has no recording of.
- Lookup order: the exact input; then the same idea text with different tap answers; then the default.
- `recorded/`: every live answer saved when `RECORD_FIXTURES=1`, named by input hash. Not loaded by fixture mode.

The unit tests do not read this folder. They use hand-written plans in `src/lib/test-data/`, whose quantities are chosen so the arithmetic can be checked by hand.
