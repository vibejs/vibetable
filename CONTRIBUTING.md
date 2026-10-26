# Contributing

Use Node ^24.15.0 or >=26 and pnpm 12.14.0. Run `pnpm install && pnpm build` before examples or tests that consume the package exports. `pnpm check` covers formatting, lint, strict TypeScript, actual `.vibe` template typing, 100% per-file adapter coverage, browser behavior, HMR and independent packed-package consumption. Chromium must be installed with `pnpm exec playwright install chromium`.

`pnpm dev` opens the examples. `pnpm bench` writes measured row-model results to stdout; browser tests record DOM measurements separately. Do not infer DOM performance from row-model timings.

Use focused branches and Conventional Commits. Never add attribution trailers. Add a changeset with `pnpm changeset` for every user-visible change; releases run only through the Release workflow. Never publish, push, deploy or create remote resources as part of local development. The Vibecn source components are owned in the separate Vibecn repository; update them there and reinstall the source into the example app when changing their API.
