# VibeTable documentation

VibeTable connects TanStack Table v9 to vibe.js. Register only the features you use, pass reactive options, and render with semantic `.vibe` templates or Vibecn's editable source components.

| Guide                                                           | Covers                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Installation and quick start](getting-started.md)              | Package setup, compiler integration, a working table                    |
| [Reactivity and state](reactivity.md)                           | Refs, computed options, controlled state, external atoms, lifecycle     |
| [Table features](features.md)                                   | Columns, sorting, filtering, pagination, selection, grouping, expansion |
| [Custom rendering and TypeScript](rendering.md)                 | Typed column helpers, `.vibe` headers/cells, slots, type errors         |
| [Vibecn, servers and VibeQuery](integrations.md)                | Source installation, composition, HTTP and optional query integration   |
| [Performance, virtualization and accessibility](performance.md) | Measurements, rendering cost, screen readers, keyboard behavior         |
| [Public API reference](api.md)                                  | Adapter exports and Core re-exports                                     |
| [Troubleshooting](troubleshooting.md)                           | Common errors and precise limitations                                   |
| [Architecture decision](decisions/0001-native-v9-adapter.md)    | Version choice, investigation findings, extension points                |

The ten [example components](../examples/kitchen-sink/src) are compiled by the real Vibe compiler and type-checked by its content mapper. Browser integration tests exercise the built application. `pnpm typecheck` also extracts and checks complete TypeScript and `.vibe` code blocks in these docs and the README.
