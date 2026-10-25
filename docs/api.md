# Public API reference

The package's only runtime entry is `@usevibejs/table`. It is ESM, has no side effects, emits declarations/source maps, and peers on `@usevibejs/ui ^0.1.0`. TanStack Core and Store are exact pinned runtime dependencies. Virtualization and styled components are separate application dependencies.

| Adapter export                         | Contract                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `useTable<TFeatures, TData>(options)`  | Returns Core's stable `Table<TFeatures, TData>`; requires an active owner scope           |
| `UseTableOptions<TFeatures, TData>`    | Native-ref options; getters for data/columns/state; static features/atoms/initialState    |
| `ReactiveTableState<TFeatures>`        | Optional controlled slices, each a value/ref/computed/getter                              |
| `useTableAtom<T>(initialValue)`        | External writable native atom, owned by the active scope                                  |
| `vibeReactivity()`                     | Advanced public implementation of Core's `TableReactivityBindings`; active scope required |
| `componentRenderer(Component)`         | Typed context-only renderer function returning a declarative descriptor                   |
| `renderContent(template, context)`     | Evaluates a scalar template/component descriptor; throws for unsupported content          |
| `isComponentContent(content)`          | Narrows `TableContent` to `ComponentContent`                                              |
| `TextContent`                          | string, number, bigint, boolean, null or undefined                                        |
| `ComponentContent`                     | kind, component and context for a declarative outlet                                      |
| `TableContent`                         | TextContent or ComponentContent                                                           |
| `TableComponentProps<TContext>`        | `{ context: TContext }`                                                                   |
| `Atom`, `ReadonlyAtom`, `Subscription` | Store's atom/subscription contracts, re-exported as types                                 |

All exports of `@tanstack/table-core` 9.3.1 are available without wrappers. Common groups:

| Core exports                                                                                                                                         | Purpose                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `createColumnHelper`, `tableFeatures`, `tableOptions`, `metaHelper`                                                                                  | Inference-preserving authoring helpers                 |
| `rowSortingFeature`, `columnFilteringFeature`, `globalFilteringFeature`, `rowPaginationFeature`, `rowSelectionFeature`                               | Common stateful features                               |
| `columnVisibilityFeature`, `columnOrderingFeature`, `columnSizingFeature`, `columnResizingFeature`, `columnPinningFeature`                           | Column interactions                                    |
| `columnGroupingFeature`, `rowAggregationFeature`, `rowExpandingFeature`, `rowPinningFeature`, `columnFacetingFeature`                                | Advanced row/column models                             |
| `cellSelectionFeature`, `cellSpanningFeature`                                                                                                        | v9 cell state and spans                                |
| `createCoreRowModel`, `createSortedRowModel`, `createFilteredRowModel`, `createGroupedRowModel`, `createExpandedRowModel`, `createPaginatedRowModel` | Model factories; the default core factory is automatic |
| `createFacetedRowModel`, `createFacetedUniqueValues`, `createFacetedMinMaxValues`                                                                    | Faceting factories                                     |
| `sortFn_*`, `filterFn_*`, `aggregationFn_*`, and their aggregate registries                                                                          | Individual algorithms and optional full registries     |
| `functionalUpdate`, `makeStateUpdater`                                                                                                               | Core updater utilities                                 |
| `Table`, `TableOptions`, `TableState`, `ColumnDef`, `Column`, `Row`, `Cell`, `Header`, `HeaderGroup`, `CellContext`, `HeaderContext`                 | Feature/row/value-parametric public types              |

Consult installed declarations and [official Table v9 documentation](https://tanstack.com/table/latest) for the complete Core API. VibeTable deliberately keeps those names and semantics. No v8 aliases or React rendering adapters are supplied. `tableOptions` is Core's plain-option helper; use `UseTableOptions` when annotating native reactive inputs.
