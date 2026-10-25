# Table features

VibeTable re-exports Table Core 9.3.1's feature logic and preserves its documented behavior. The [feature registry](https://tanstack.com/table/latest/docs/framework/vue/guide/table-state) determines options, state and method inference. Register factories under `features`, and named filter/sort/aggregation functions in its registries. Import individual functions to keep bundles small.

## Column definitions

Use `createColumnHelper<typeof features, Row>()`. `helper.accessor('nested.key', ...)` or an accessor function infers the cell value. `helper.columns([...])` preserves heterogeneous accessor types. `helper.display` creates selection/action columns, and `helper.group` creates nested headers. Supply stable column IDs for function accessors and custom header components. Meta types can be declared per table through `features.columnMeta` and `features.tableMeta` phantom slots; no global type augmentation is necessary.

`columnVisibilityFeature`, `columnOrderingFeature`, `columnSizingFeature`, `columnResizingFeature` and `columnPinningFeature` expose the corresponding states and APIs. Resizing requires sizing, and `tableFeatures` reports missing prerequisites. V9 pinning uses logical `start`/`end` positions. The renderer chooses whether and how pinned columns become sticky; Core does not add CSS. [Columns.vibe](../examples/kitchen-sink/src/Columns.vibe) demonstrates hide/show, ordering, pointer resizing and keyboard resizing. Grouped headers preserve `colSpan`, `rowSpan` and placeholder semantics. Responsive overflow and density are renderer concerns.

## Sorting

Register `rowSortingFeature` and `sortedRowModel: createSortedRowModel()`. Register only the comparators you use, for example `sortFns: { text: sortFn_text }`, then specify `sortFn: 'text'` on columns. Use `column.toggleSorting`, `table.setSorting`, `column.getIsSorted` and Core's multi-sort event handler. A custom comparator receives rows and the column ID. Manual sorting (`manualSorting: true`) retains supplied row order while exposing sorting state for your server request. [Customers.vibe](../examples/kitchen-sink/src/Customers.vibe) includes a multi-column preset.

## Filtering and faceting

Register `columnFilteringFeature` and `filteredRowModel: createFilteredRowModel()`. Add `globalFilteringFeature` for global search. `column.setFilterValue` and `table.setGlobalFilter` use normal Core updater semantics. Named filter registries infer valid column filter names. Built-ins cover case-sensitive/insensitive text, numeric comparisons/ranges, date ranges, arrays and empty values. Custom predicates can implement application-specific combinations; do not coerce every input to text.

Facets require `columnFacetingFeature` plus the `facetedRowModel`, `facetedUniqueValues` and optional `facetedMinMaxValues` factories. Faceted controls need a filter function whose input shape matches the control: the example multi-select sends `string[]` and uses a membership predicate. `manualFiltering: true` accepts already-filtered server rows. [Products.vibe](../examples/kitchen-sink/src/Products.vibe) combines search, faceted categories and a numeric price range. Tests also cover actual Date objects and custom predicates.

## Pagination

Register `rowPaginationFeature` and `paginatedRowModel: createPaginatedRowModel()` for client pagination. Core coordinates page index, page size, navigation, counts and auto-reset behavior. Pass `manualPagination: true` for server pages, along with total `rowCount` or `pageCount`. Unknown page counts use `pageCount: -1`; a last-page control must then be disabled. `useTableAtom` or a controlled `state.pagination` plus `onPaginationChange` can own pagination externally. [Invoices.vibe](../examples/kitchen-sink/src/Invoices.vibe) shows native external ownership; [Server.vibe](../examples/kitchen-sink/src/Server.vibe) shows manual pagination.

## Row selection and actions

Register `rowSelectionFeature`. Set `getRowId` to a domain identifier before selection must persist across pages or data replacement. `row.toggleSelected`, page/all selection, partial selection, single selection and sub-row selection retain Core semantics. `enableMultiRowSelection: false` enables single selection. `getSelectedRowIds()` can include IDs absent from the current manual page; `getSelectedRowModel()` only materializes rows available in the current data. Scope bulk actions intentionally, and perform server mutations in the application. The [payments example](../examples/kitchen-sink/src/Payments.vibe) includes page selection, bulk status updates and row actions.

## Grouping, aggregation and expansion

Register `columnGroupingFeature` and `groupedRowModel: createGroupedRowModel()` for grouping. Aggregation is an independent v9 feature: register `rowAggregationFeature` and the aggregation functions your columns use. Register `rowExpandingFeature` and `expandedRowModel: createExpandedRowModel()` to show child/group rows. Nested data uses `getSubRows`; UI buttons use `row.getCanExpand`, `getIsExpanded` and `toggleExpanded` with `aria-expanded`. Aggregated and placeholder cells are renderer decisions; DataTable uses `aggregatedCell` where supplied. [Hierarchy.vibe](../examples/kitchen-sink/src/Hierarchy.vibe) demonstrates nested rows; adapter tests verify grouping and sums.

## Additional v9 features

`rowPinningFeature`, `cellSelectionFeature` and `cellSpanningFeature` are available without adapter wrappers. Tests verify pinned rows, cell-range state and merged-cell coverage. The generic Vibecn DataTable supplies ordinary semantic table rendering, not a spreadsheet grid. Applications using cell spans must render Core's span/covered-cell APIs, and cell selection needs its corresponding keyboard/pointer UI. These are Core capabilities, not prebuilt Vibecn interactions.
