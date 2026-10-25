import { effectScope } from '@usevibejs/ui';
import { onTestFinished } from 'vitest';
import {
  tableFeatures,
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPinningFeature,
  columnFacetingFeature,
  cellSelectionFeature,
  cellSpanningFeature,
  createSortedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createGroupedRowModel,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFacetedMinMaxValues,
  sortFns,
  filterFns,
  aggregationFns,
  createColumnHelper,
} from '../src/index.ts';

export const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPinningFeature,
  columnFacetingFeature,
  cellSelectionFeature,
  cellSpanningFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  sortFns,
  filterFns,
  aggregationFns,
});
export interface Person {
  id: string;
  name: string;
  age: number;
  team: string;
  date: Date;
  children?: Person[];
}
export const people: Person[] = [
  { id: 'a', name: 'Ada', age: 36, team: 'Engineering', date: new Date('2026-01-01') },
  { id: 'b', name: 'Grace', age: 45, team: 'Engineering', date: new Date('2026-02-01') },
  { id: 'c', name: 'Linus', age: 30, team: 'Design', date: new Date('2026-03-01') },
  { id: 'd', name: 'Alan', age: 36, team: 'Design', date: new Date('2026-04-01') },
];
const helper = createColumnHelper<typeof features, Person>();
export const columns = helper.columns([
  helper.accessor('name', { header: 'Name', filterFn: 'includesString', sortFn: 'text' }),
  helper.accessor('age', {
    header: 'Age',
    filterFn: 'inNumberRange',
    aggregationFn: 'sum',
    sortFn: 'basic',
  }),
  helper.accessor('team', { header: 'Team', filterFn: 'equalsString' }),
  helper.accessor('date', { header: 'Joined', filterFn: 'inDateRange', sortFn: 'datetime' }),
]);
export function scoped<T>(fn: () => T): T {
  const scope = effectScope();
  onTestFinished(() => scope.stop());
  return scope.run(fn)!;
}
