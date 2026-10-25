# Performance, virtualization and accessibility

## Measure the right work

`pnpm bench` measures 1,000, 10,000 and 50,000 rows. It records the cold core model, sorting, filtering and 1,000 cached reads separately. Two warmups precede five measured samples; output is the median and includes date, Node version, architecture and platform. Data allocation is excluded. These are CPU/model timings, not DOM timings, and are not portable performance guarantees.

The [recorded local model results](../benchmarks/results.json) include machine/runtime metadata. Run `pnpm bench:browser` for the optional browser benchmark. Its mount timing measures setup through DOM mount and virtualizer initialization; it is not a paint or interaction-latency measurement.

The production-browser suite measures the virtualized view's row model and mount time and asserts bounded DOM rows. Selection tests verify that existing row DOM is preserved and that selection causes no child-list mutations inside the table body. Adapter tests verify that cached row-model reads and page count computations do not rerun for selection-only changes. Run `pnpm test:integration` to reproduce browser checks. Avoid comparing a JSDOM time with a Chromium rendering time.

## Practical guidance

Keep data and columns stable until they change. Use shallow refs and immutable row replacement. Register only needed features, row models and functions. Paginate ordinary tables; use server pagination for network-sized datasets. Prefer row/column reads over `table.store` subscriptions when a component needs one state slice. Avoid repeatedly constructing column definitions in an options getter. Do not render 50,000 ordinary table rows merely because the row model can compute them.

Core accessor values are memoized by row. A retained row reference from before a data replacement remains an old Core row object. Obtain current rows through `table.getRowModel()` or `table.getRow(id)`; keyed `.vibe` loops update their row refs automatically.

## Optional virtualization

[Virtualized.vibe](../examples/kitchen-sink/src/Virtualized.vibe) uses `@tanstack/virtual-core` 3.19.7 with a 40px fixed row height, built-in element observers/scrolling and six rows of overscan. Only the returned virtual items are rendered. It shows cold row-model time, DOM mount time and current DOM row count; a jump control scrolls to actual row 5,001. Core observers are disposed with the Vibe scope. No virtualizer is bundled into VibeTable.

This is a read-focused table view. It exposes the total `aria-rowcount`, absolute `aria-rowindex`, native table headers, a caption and a focusable scroll region. Spacer rows are presentational and hidden from assistive technology. Virtualization removes offscreen rows from the accessibility tree; screen-reader traversal cannot see all records at once. Use paginated tables when full traversal, editable cells, focus retention or spreadsheet-style navigation is required. Dynamic-height rows, horizontal virtualization and a reusable virtualization adapter are outside this release.

## Accessible rendering

Headless Core cannot make arbitrary consumer markup accessible. Vibecn provides semantic table/caption/head/body/row/header/cell elements, column scope and nested header spans. Sorted headers expose `aria-sort`; controls have explicit labels. Native checkboxes supply keyboard selection, with indeterminate state on page selection. Menus preserve Vibecn's established arrow-key, Escape and focus behavior. Native page-size selects remain keyboard-operable. Resize separators have a focus target, current/min/max values and Left/Right keys.

Loading exposes `aria-busy`, skeletons are decorative and loading text is announced once. Error content uses `role="alert"`; retry belongs to the application. Selection feedback uses a status region, and status badges always include text. Focus-visible styles, horizontal overflow, compact/comfortable density and existing dark-mode tokens are preserved. Test your customized copy with the assistive technologies and browser versions you support; automated assertions cover semantics and keyboard behavior, not every screen reader.
