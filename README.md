# VibeTable

**Powerful Headless Tables for Vibe.js**

`@usevibejs/table` is a native, fine-grained [Vibe.js](https://vibejs.org) adapter for **TanStack Table Core v9**. Stable table instances, typed feature registration, reactive options and state atoms, and declarative `.vibe` cells. No DOM renderer, virtual DOM, CSS, React, or Vue dependency.

## Install

```sh
pnpm add @usevibejs/table @usevibejs/ui
pnpm add -D @usevibejs/compiler @usevibejs/language-tools vite
```

`@usevibejs/ui` is a peer dependency. Compiler and UI versions must match; this release is verified against Vibe.js 0.1.0.

## Quick start

```html
<script setup lang="ts">
  import {
    useTable,
    tableFeatures,
    rowSortingFeature,
    createSortedRowModel,
    sortFn_text,
  } from '@usevibejs/table';
  import { shallowRef } from '@usevibejs/ui';
  const data = shallowRef([{ id: 'a', name: 'Ada Lovelace' }]);
  const features = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { text: sortFn_text },
  });
  const table = useTable({
    features,
    data,
    columns: [{ accessorKey: 'name', header: 'Name', sortFn: 'text' }],
    getRowId: (row) => row.id,
  });
</script>
<template>
  <table>
    <caption>
      Customers
    </caption>
    <thead>
      <tr>
        <th scope="col">
          <button type="button" @click="table.getColumn('name')!.toggleSorting()">
            Name {{ table.getColumn('name')!.getIsSorted() || '' }}
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in table.getRowModel().rows" :key="row.id">
        <td>{{ row.getValue('name') }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

Use `useTable` inside component setup or an active `effectScope`. Data and columns support refs, computed values and getters. Replace arrays when editing them, so TanStack can invalidate its memoized models. Features, external atom maps and initial state are static for the table's lifetime, following Core v9's contract.

## Features

- **Features:** sorting, multi-sorting, filters, faceting, pagination, selection, visibility, ordering, resizing, pinning, grouped headers, grouping, aggregation, expansion, cell selection and cell spanning through Core's feature exports.
- **Native reactivity:** state slices use Vibe shallow refs and computed values through `coreReactivityFeature`. Reading table, row and column APIs establishes native dependencies. External atoms are bridged and subscriptions stop with their owner.
- **Custom content:** `componentRenderer(MyCell)` checks the `.vibe` component's `context` prop. `renderContent` evaluates scalar templates or returns a component descriptor for a declarative outlet.
- **Styled components:** Vibecn's `add data-table` installs editable source components and all primitive dependencies. Its payments dashboard demonstrates filters, sorting, selection, bulk actions, CSV export and row actions.

## Documentation

- [Documentation index](docs/README.md)
- [Installation and quick start](docs/getting-started.md)
- [Reactivity and state](docs/reactivity.md)
- [Table features](docs/features.md)
- [Custom rendering and TypeScript](docs/rendering.md)
- [Vibecn, servers and VibeQuery](docs/integrations.md)
- [Performance, virtualization and accessibility](docs/performance.md)
- [Public API reference](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Architecture and compatibility](docs/decisions/0001-native-v9-adapter.md)
- [Runnable examples](examples/kitchen-sink)
- [Contributing](CONTRIBUTING.md) and [security policy](SECURITY.md)

## Local development

```sh
pnpm install
pnpm build
pnpm check
pnpm dev                     # ten working examples
pnpm bench                   # 1,000 / 10,000 / 50,000 row models
pnpm build:examples
```

`pnpm check` needs Chromium: `pnpm exec playwright install chromium`.

The virtualized example is a fixed-height, read-focused implementation built on TanStack Virtual Core. Ordinary tables remain semantic, paginated tables; the virtualized view documents its assistive-technology traversal limits. Server examples include a real local HTTP API for development and production preview; host that endpoint separately when deploying the static assets.

## Releases

Releases use changesets. Add a changeset with `pnpm changeset` for every user-visible change. A maintainer runs the Release workflow from main, which opens a release PR and publishes to npm through trusted publishing.

## The vibe.js family

| Package                                                   | Description                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| [vibe.js](https://github.com/vibejs/vibejs)               | The framework: .vibe components, server and typed contracts |
| [@usevibejs/auth](https://github.com/vibejs/vibeauth)     | Authentication with Better Auth                             |
| [@usevibejs/form](https://github.com/vibejs/vibeform)     | Type-safe forms with TanStack Form                          |
| [@usevibejs/motion](https://github.com/vibejs/vibemotion) | Animations, gestures and layout with Motion                 |
| [@usevibejs/query](https://github.com/vibejs/vibequery)   | Async state and data fetching with TanStack Query           |
| [@usevibejs/table](https://github.com/vibejs/vibetable)   | Headless tables with TanStack Table                         |
| [@usevibejs/use](https://github.com/vibejs/vibeuse)       | Essential composables                                       |
| [vibecn](https://github.com/vibejs/vibecn)                | shadcn/ui components as .vibe source                        |

## License

MIT. See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Independent of TanStack; uses its public extension points.
