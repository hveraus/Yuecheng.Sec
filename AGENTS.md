# Repository Guidelines

## Project Structure & Module Organization

This repository contains a static Three.js hospital security cockpit. `dist/` is the editable source and deployment directory, not generated output. `dist/app.js` coordinates the scene and dashboard; `campus-model.js`, `floor-browser.js`, `floor-interior.js`, `landscape.js`, and `parking.js` own their respective models and interactions. `transitions.js` handles animation timing, while `ui-effects.js` controls interface effects. Styles live in `style.css` and `theme.css`.

Reference images belong in `dist/assets/`. Vendored Three.js modules and their license live in `dist/vendor/`. Tests are in `tests/`; `.openai/hosting.json` configures static hosting.

## Build, Test, and Development Commands

Use Node.js, npm, and Python 3.

- `npm ci`: install the locked test dependency, Three.js.
- `npm run dev`: serve `dist/` at `http://localhost:5174` using Python.
- `npm run check`: run Node syntax checks on application modules.
- `npm test`: run interaction, floor, parking, and transition checks.

The main cockpit needs no build step. After editing `dist/agent/src/campus3d.js` or its shared imports, run `npm run build:agent` and commit the refreshed bundle. Browsers load the committed local Three.js modules through the import map in `dist/index.html`.

## Coding Style & Naming Conventions

Use JavaScript ES modules, explicit `.js` import extensions, single-quoted strings, and semicolons. Match surrounding formatting; compact modules commonly use one-space indentation. Avoid unrelated formatting changes. Use camelCase for functions and variables, kebab-case for module filenames and CSS classes, and descriptive feature-specific names.

No formatter or linter is configured; `npm run check` validates syntax only. Keep vendored Three.js files, the npm dependency, and licensing consistent when upgrading.

## Testing Guidelines

Tests use Node's `node:assert/strict` with lightweight DOM stubs, not a browser test framework. Name tests `tests/<feature>.test.mjs` and add new suites to the `test` script. No numerical coverage threshold is configured.

Test changed behavior and invariants, especially unique device IDs, floor containment, parking totals, filters, and interrupted animations. For visual changes, also check building selection, floor isolation, automatic zoom, parking, and motion toggles in a browser.

## Commit & Pull Request Guidelines

History includes `Update Site source` snapshots and imperative descriptions such as `Make cockpit checkout independently installable`; no formal commit prefix is established. Prefer concise, action-oriented messages.

PRs should explain the behavior change, link relevant issues, report validation, and include screenshots for visual changes. Identify remaining limitations.

## Model & Data Boundaries

Buildings, interiors, devices, and occupancy are illustrative. Preserve visible demo labels; do not present reconstructed geometry as surveyed BIM or simulated cameras as live feeds. Never commit credentials or private surveillance data.
