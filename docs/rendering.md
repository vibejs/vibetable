# Custom rendering and TypeScript

Vibe compiles `.vibe` templates into fine-grained DOM bindings. It has no JSX, React `flexRender`, public `h` function, or virtual DOM. VibeTable therefore evaluates a template's content without mounting anything. Application source owns the declarative outlet.

Text headers/cells can be strings or functions returning a scalar. Format numeric/date values with `Intl` or return a string. `renderContent(template, context)` returns a scalar or a component descriptor. Normal interpolation escapes text; strings containing markup remain text. Objects, DOM nodes, JSX-like values and functions returned from a template are rejected.

For a component, declare exactly one required prop named `context` using `CellContext<Features, Row, Value>` or `HeaderContext<Features, Row, Value>`. Register it as `componentRenderer(MyCell)` in the column definition. The helper checks the component's public signature, including the accessor value and feature set; extra required props are rejected because the outlet supplies only `context`. Optional props may have component defaults. Put application commands in typed table meta or close over them in application-owned slots/components.

The complete working implementation is in [AmountCell.vibe](../examples/kitchen-sink/src/payments/AmountCell.vibe), [ActionsCell.vibe](../examples/kitchen-sink/src/payments/ActionsCell.vibe), [SelectionHeader.vibe](../examples/kitchen-sink/src/payments/SelectionHeader.vibe) and [Payments.vibe](../examples/kitchen-sink/src/Payments.vibe). The outlet is installed as [DataTableContent.vibe](../examples/kitchen-sink/src/components/ui/DataTableContent.vibe). It uses a computed value and `<component :is>`; changes to a row/cell context update the component's prop getters and native reads without remounting the entire table.

Custom header components, selection checkboxes, dropdown actions and cells all work with actual compiled `.vibe` files. Browser/component tests verify sorting through a custom header, typed numeric formatting, row updates, HTML escaping and keyed DOM identity.

## Template typing boundary

Vibe currently does not support generic SFCs. Its dynamic component type helper also intentionally accepts loose props. `componentRenderer` closes that typing gap when the component is registered. The generic outlet erases its context to `object` only after registration; it adds no runtime DOM operations. Avoid manually constructing component descriptors.

Vibecn's generic DataTable slots receive structural row/cell/header views, with row originals typed `unknown`. Use a typed custom cell component when the original row shape matters. Direct application `.vibe` templates can also loop over their own fully typed table instance and render imported components with ordinary checked props.

## Inference checks

The library preserves Core's feature-based generics. Unregistered feature APIs are absent, missing factory prerequisites produce useful errors, unknown comparator names are rejected, and accessor values retain their types. Compile-time assertions live in `src/api.test-d.ts` and real `.vibe` fixtures. Prefer helper.columns for mixed accessor values; assigning all columns to `ColumnDef<..., unknown>[]` erases the variance relationships Core intentionally preserves.

The headless package re-exports upstream types as-is, including Core's own broad internal/default types. VibeTable introduces no public `any` escape hatch.
