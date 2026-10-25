# Reactive data and state

`useTable` returns a stable TanStack `Table<TFeatures, TData>`. It must run during component setup or inside an active Vibe `effectScope`. Reads in a template, computed value or watcher track the native refs below the table methods. Copying a method result into a plain variable creates a snapshot; derive values with `computed` when they must stay live.

Data and columns accept plain values, refs, computed refs and getters. All other dynamic options accept refs; a whole-options getter supports reactive scalar options without confusing callback functions with getters. Callbacks such as `getRowId` and `onSortingChange` remain callbacks and are not invoked during option resolution.

```ts
import { computed, shallowRef, effectScope } from '@usevibejs/ui';
import { tableFeatures, rowSelectionFeature, useTable } from '@usevibejs/table';
export function createScopedExample() {
  const scope = effectScope();
  const data = shallowRef([{ id: 'a', name: 'Ada' }]);
  const enabled = shallowRef(true);
  const table = scope.run(() =>
    useTable(() => ({
      features: tableFeatures({ rowSelectionFeature }),
      data,
      columns: [{ accessorKey: 'name', header: 'Name' }],
      getRowId: (row) => row.id,
      enableRowSelection: enabled.value,
    })),
  )!;
  const count = computed(() => table.getRowModel().rows.length);
  data.value = [...data.value, { id: 'b', name: 'Grace' }];
  return { table, count, stop: () => scope.stop() };
}
```

Use reference replacement for data, columns and state slice values. TanStack memoizes row models and accessor values. Mutating an array or record in place can leave those caches unchanged even if the object is a deep Vibe ref. Use `shallowRef` for large datasets and replace the changed row in a new array.

## Uncontrolled state

Register a feature and omit `state`/`atoms` to let Core manage it. `initialState` customizes defaults and reset targets. Table methods and `table.atoms.sorting.get()` expose the live state. Only registered features contribute atom keys, preserving feature-specific inference.

## Controlled state

Pass a controlled value and its matching `on[Slice]Change` callback. Each `state` slice may itself be a ref, computed value or getter. Use Core's `functionalUpdate` to handle both value and function updaters. Omitting a callback freezes the controlled value; it does not make the slice uncontrolled. Setting a controlled slice to `undefined` restores the initial value while it remains controlled. Removing the property relinquishes ownership.

```ts
import { effectScope, shallowRef } from '@usevibejs/ui';
import { functionalUpdate, rowSortingFeature, tableFeatures, useTable } from '@usevibejs/table';
import type { SortingState } from '@usevibejs/table';
export function controlledSorting() {
  const scope = effectScope();
  const sorting = shallowRef<SortingState>([]);
  const table = scope.run(() =>
    useTable({
      features: tableFeatures({ rowSortingFeature }),
      data: [{ name: 'Ada' }],
      columns: [{ accessorKey: 'name' }],
      state: { sorting },
      onSortingChange: (updater) => {
        sorting.value = functionalUpdate(updater, sorting.value);
      },
    }),
  )!;
  return { table, sorting, stop: () => scope.stop() };
}
```

## External atoms

`useTableAtom(initialValue)` creates an external atom backed by a native shallow ref. Pass it in `atoms.pagination` or another registered slice; Core writes through it. External atoms take precedence over `state`, followed by internal base atoms. [Invoices.vibe](../examples/kitchen-sink/src/Invoices.vibe) demonstrates application-owned pagination. Standard TanStack Store atoms also work: Core's documented wrapper bridges subscriptions into Vibe, and stops them with the table scope.

`features`, `atoms` maps and `initialState` are fixed at construction, following Table Core's contract. Update the values held by an external atom, rather than replacing the atom. Recreate the owning component/scope when changing static configuration.

## Subscriptions and cleanup

Atom subscriptions return `{ unsubscribe() }` and accept a callback or `{ next }` observer. They notify on changes, without an initial notification. Explicit unsubscribe is useful for early cleanup; the table's child scope also owns the watchers. `table.store` aggregates all state and is a broad subscription boundary; prefer individual atoms or row/column methods.

Stopping the owner stops option watchers, native subscriptions, Core's external atom subscriptions and scheduled work. Detached asynchronous code should create its own explicit scope and stop it. Vibe batches DOM jobs; synchronous atom observers may see intermediate states when Core changes several slices. VibeTable promises no atomic multi-slice transaction.
