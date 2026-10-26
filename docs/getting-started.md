# Installation and quick start

Use Node ^24.15.0 or >=26, pnpm and a Vibe.js 0.1.0 client application. Install `@usevibejs/table` alongside `@usevibejs/ui`. Use matching versions of `@usevibejs/compiler`, `@usevibejs/language-tools` and UI. Table Core 9.3.1 is an exact runtime dependency; do not override it with v8.

```sh
pnpm add @usevibejs/table @usevibejs/ui
pnpm add -D @usevibejs/compiler @usevibejs/language-tools vite
```

To try unreleased changes, build this repository, run `pnpm pack`, then add the tarball to your application. The packed manifest contains versioned dependencies, with no workspace links. Existing Vibe apps need no extra compiler plugin for the adapter: the ordinary `vibe()` Vite plugin compiles consumer `.vibe` files.

The README's quick start is a complete `.vibe` component. [Basic.vibe](../examples/kitchen-sink/src/Basic.vibe) demonstrates the same engine with Vibecn's DataTable. Keep `useTable` in setup; it creates the instance once. Read `table.getRowModel()` directly in templates. Vibe tracks the native atoms read beneath those methods.

For sorting, register `rowSortingFeature`, `sortedRowModel: createSortedRowModel()` and the named comparator functions your columns use in `tableFeatures`. The core row model is automatic. Additional row models live in the feature registry, rather than top-level v8 `get...RowModel` options.

For styled tables, install Vibecn's `data-table` registry item and use DataTable, DataTableToolbar and DataTablePagination with the same table instance. [Integration details](integrations.md) explain the source distribution and local installation before publication.

Run all examples locally:

```sh
pnpm install
pnpm build
pnpm dev
```

The example API is supplied by its Vite development and preview plugin. A static host needs a separately hosted endpoint; a static build does not embed a server.
