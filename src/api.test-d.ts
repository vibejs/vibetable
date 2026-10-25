import { expectTypeOf } from 'vitest';
import type { Component, Handle } from '@usevibejs/ui';
import { computed, shallowRef } from '@usevibejs/ui';
import {
  componentRenderer,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from './index.ts';
import type { CellContext, SortingState } from './index.ts';
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
});
interface Person {
  name: string;
  age: number;
  nested: { email: string };
}
const helper = createColumnHelper<typeof features, Person>();
helper.accessor('age', {
  cell: (context) => {
    expectTypeOf(context.getValue()).toEqualTypeOf<number>();
    return context.getValue().toFixed(2);
  },
});
helper.accessor('nested.email', {
  cell: (context) => {
    expectTypeOf(context.getValue()).toEqualTypeOf<string>();
    return context.getValue();
  },
});
// @ts-expect-error Invalid accessor key.
helper.accessor('missing', {});
// @ts-expect-error Missing required sorting feature.
tableFeatures({ sortedRowModel: createSortedRowModel() });
// @ts-expect-error Unregistered comparator.
helper.accessor('name', { sortFn: 'notRegistered' });
const table = useTable({
  features,
  data: shallowRef<Person[]>([]),
  columns: [],
  state: { sorting: computed<SortingState>(() => []) },
});
expectTypeOf(table.atoms.sorting.get()).toEqualTypeOf<SortingState>();
// @ts-expect-error Pagination was not registered.
table.atoms.pagination.get();
// @ts-expect-error Row fields keep their data types.
const invalid: number = table.getRow('0').original.name;
const cell = {} as Component<
  (props: { context: CellContext<typeof features, Person, number> }) => Handle
>;
helper.accessor('age', { cell: componentRenderer(cell) });
// @ts-expect-error The component expects a numeric cell value.
helper.accessor('name', { cell: componentRenderer(cell) });
const extra = {} as Component<
  (props: { context: CellContext<typeof features, Person, number>; required: string }) => Handle
>;
// @ts-expect-error The outlet supplies context only; additional required props are rejected.
componentRenderer(extra);
void invalid;
useTable({
  features: tableFeatures({}),
  data: [{ name: 'Ada' }],
  columns: [],
  // @ts-expect-error Pagination options require a registered pagination feature.
  manualPagination: true,
});
