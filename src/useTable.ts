import { getCurrentScope, onScopeDispose, toValue, unref, watch } from '@usevibejs/ui';
import type { MaybeRef, MaybeRefOrGetter } from '@usevibejs/ui';
import { constructTable } from '@tanstack/table-core';
import type { RowData, Table, TableFeatures, TableOptions, TableState } from '@tanstack/table-core';
import { vibeReactivity } from './reactivity.ts';

/** Each controlled slice can independently be a ref, computed value, or getter. */
export type ReactiveTableState<TFeatures extends TableFeatures> = {
  readonly [K in keyof TableState<TFeatures>]?: MaybeRefOrGetter<TableState<TFeatures>[K]>;
};

type StaticOption = 'features' | 'atoms' | 'initialState';
type SourceOption = 'data' | 'columns' | 'state';

/** Callbacks remain callbacks. Use a whole-options getter for reactive scalar options. */
export type UseTableOptions<TFeatures extends TableFeatures, TData extends RowData> = {
  readonly [K in keyof Omit<TableOptions<TFeatures, TData>, StaticOption | SourceOption>]: MaybeRef<
    TableOptions<TFeatures, TData>[K]
  >;
} & Pick<TableOptions<TFeatures, TData>, StaticOption> & {
    readonly data: MaybeRefOrGetter<ReadonlyArray<TData>>;
    readonly columns: MaybeRefOrGetter<TableOptions<TFeatures, TData>['columns']>;
    readonly state?: MaybeRefOrGetter<ReactiveTableState<TFeatures>>;
  };

function resolveOptions<TFeatures extends TableFeatures, TData extends RowData>(
  source: MaybeRefOrGetter<UseTableOptions<TFeatures, TData>>,
): TableOptions<TFeatures, TData> {
  const options = toValue(source);
  const resolved = Object.fromEntries(
    Object.entries(options).map(([key, value]) => [key, unref(value)]),
  );
  resolved.data = toValue(options.data);
  resolved.columns = toValue(options.columns);
  const state = options.state === undefined ? undefined : toValue(options.state);
  resolved.state =
    state === undefined
      ? undefined
      : Object.fromEntries(Object.entries(state).map(([key, value]) => [key, toValue(value)]));
  // A fresh map prevents Core's external-atom wrappers from mutating caller-owned configuration.
  resolved.atoms = options.atoms === undefined ? undefined : { ...options.atoms };
  return resolved as TableOptions<TFeatures, TData>;
}

/**
 * Constructs one stable headless table, owned by the current component/effect scope.
 * Read table/row/column methods inside templates, computed values, or watchers to track them.
 * Data and columns use reference replacement, following TanStack's memoization contract.
 */
export function useTable<TFeatures extends TableFeatures, TData extends RowData>(
  options: MaybeRefOrGetter<UseTableOptions<TFeatures, TData>>,
): Table<TFeatures, TData> {
  if (!getCurrentScope()?.active)
    throw new Error('useTable() requires an active component or effect scope.');
  const reactivity = vibeReactivity();
  try {
    const initial = resolveOptions(options);
    const table = constructTable({
      ...initial,
      features: { ...initial.features, coreReactivityFeature: reactivity },
    });
    onScopeDispose(() => reactivity.unmount?.());
    // Watch's callback runs untracked; Core reads cannot become option-source dependencies.
    watch(
      () => resolveOptions(options),
      (next) => table.setOptions(next),
      { flush: 'sync' },
    );
    return table;
  } catch (error) {
    reactivity.unmount?.();
    throw error;
  }
}
