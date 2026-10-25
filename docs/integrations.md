# Vibecn and server integration

## Source installation

Vibecn's `data-table` registry item contains eleven editable `.vibe` building blocks and a type-only utility. It resolves Table, Button, Input, Checkbox, Skeleton, DropdownMenu and their existing utility dependencies. It preserves existing primitives and copy-and-own customization.

```sh
vibecn add data-table
```

The installer reports `@usevibejs/table@0.1.0` as a required dependency. Following Vibecn's contract, it copies trusted bundled source and licenses, validates destinations and conflicts, and does not edit package.json or execute a package manager. Before publication, build/pack VibeTable and install the local tarball. The two repositories remain independent; the development workspace override links the local adapter only for site verification. It is absent from the VibeTable packed manifest.

| Component                 | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| DataTable                 | Semantic headers/cells, grouped headers, density, loading/error/empty states |
| DataTableContent          | Declarative scalar/component outlet                                          |
| DataTableColumnHeader     | Sorting menu, indicators, clear sort and hide action                         |
| DataTableToolbar          | Global search, reset, filter/action slots and view options                   |
| DataTableFacetedFilter    | Membership filters with facet counts                                         |
| DataTableViewOptions      | Column visibility menu                                                       |
| DataTablePagination       | Counts, page size, first/previous/next/last controls                         |
| DataTableRowActions       | Application-owned commands in an accessible menu                             |
| DataTableSelectionActions | Selected count, clear selection and a bulk-action slot                       |
| DataTableEmptyState       | Semantic empty row and customizable guidance                                 |
| DataTableLoadingState     | Skeleton rows and an announced loading status                                |

The consumer owns the table and passes it to these components. Every feature method in the structural component interface is optional except core read APIs, so basic tables can render without registering unrelated features. Actions run application callbacks; the adapter owns no mutation or network policy. The payments dashboard includes real CSV export via a declarative download link, status changes, refunds and removal from local data.

## Server-side tables

Set `manualPagination`, `manualSorting` and `manualFiltering` as needed. Supply the current server page as `data`, and counts as `rowCount`/`pageCount`. Let query state derive from the same table atoms used by the UI. Reset pagination intentionally when filters/sorting change. The table's stable row IDs preserve selection across page replacement, though loaded row models cannot materialize unloaded server records.

[Server.vibe](../examples/kitchen-sink/src/Server.vibe) and its [HTTP endpoint](../examples/kitchen-sink/server.ts) are runnable together. A public Vibe watcher owns an AbortController and cancels superseded requests and requests active on unmount. Response writes check cancellation. The component exposes loading/error/retry states. The endpoint validates page size, performs search/sorting and returns real JSON over HTTP in both Vite development and production preview. It is sample application data served by a real endpoint, not a mocked fetch implementation.

## Optional VibeQuery

VibeQuery is separately maintained and is not a VibeTable dependency. Its inspected public API exports `useQuery`, `QueryClient`, `createVibeQueryPlugin`, `keepPreviousData` and reactive query options. Install its plugin on the application, derive a query key from pagination/sorting/filter atoms, and pass the query's reactive data and total counts through a `useTable` options getter. Its stable result exposes `data`, `error` and query status directly; avoid destructuring them into snapshots. Pass the query function's `signal` into fetch for cancellation, and include every request parameter in the key so cached pages cannot collide.

The included server example uses fetch directly, so it runs without VibeQuery. This release provides integration guidance, not a separately tested VibeQuery example or a dependency cycle.
