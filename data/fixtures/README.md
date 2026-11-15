# Fixtures

- `ask/`, `plan/`, `scrap/`: hand-written sample answers. Fixture mode (`AI_PROVIDER=fixture`) and the unit tests read these. Any screen built from them shows a "Sample data" banner.
- `recorded/`: real answers from the live model, saved when `RECORD_FIXTURES=1`. Not loaded by fixture mode. Each file holds the input key, the model, the time and the validated output.

SPEC 4.1 says to replace the hand-written fixtures with recorded ones once a live provider works. That has not been done yet: the tests and `check:m2` are written against the hand-written ones, and most recordings from Nov 14 predate that evening's prompt fixes.
