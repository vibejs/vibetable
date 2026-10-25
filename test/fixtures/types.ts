import {
  createColumnHelper,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from '../../src/index.ts';
export interface Item {
  id: string;
  name: string;
  amount: number;
}
export const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
});
export type Features = typeof features;
export const helper = createColumnHelper<Features, Item>();
