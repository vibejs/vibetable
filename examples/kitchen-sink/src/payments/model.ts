import {
  columnFilteringFeature,
  columnFacetingFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  filterFn_includesString,
  sortFn_text,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  createColumnHelper,
} from '@usevibejs/table';
export interface Payment {
  id: string;
  name: string;
  email: string;
  status: 'Paid' | 'Processing' | 'Failed' | 'Refunded';
  amount: number;
  date: Date;
}
export interface PaymentCommands {
  markPaid: (id: string) => void;
  refund: (id: string) => void;
  remove: (id: string) => void;
}
export const paymentFeatures = tableFeatures({
  columnFilteringFeature,
  columnFacetingFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { text: sortFn_text, basic: sortFn_basic, datetime: sortFn_datetime },
  tableMeta: {} as PaymentCommands,
});
export type PaymentFeatures = typeof paymentFeatures;
export const paymentColumns = createColumnHelper<PaymentFeatures, Payment>();
const names = [
  'Olivia Rhye',
  'Phoenix Baker',
  'Lana Steiner',
  'Demi Wilkinson',
  'Drew Cano',
  'Natali Craig',
  'Orlando Diggs',
  'Andi Lane',
  'Kate Morrison',
  'Avery Lane',
  'Morgan Chen',
  'Alex Rivera',
];
export const initialPayments: Payment[] = Array.from({ length: 36 }, (_, index) => ({
  id: `PAY-${String(1048 - index).padStart(4, '0')}`,
  name: names[index % names.length],
  email: `${names[index % names.length].toLowerCase().replace(' ', '.')}@example.com`,
  status: index % 7 === 2 ? 'Failed' : index % 4 === 1 ? 'Processing' : 'Paid',
  amount: [316, 242, 837, 874, 721, 150, 529, 1290, 480, 96, 199, 2500][index % 12],
  date: new Date(Date.UTC(2026, 9, 25 - (index % 25))),
}));
export const formatMoney = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
