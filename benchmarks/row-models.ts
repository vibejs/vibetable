import { performance } from 'node:perf_hooks';
import { effectScope } from '@usevibejs/ui';
import {
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  columnFilteringFeature,
  rowSortingFeature,
  filterFn_includesString,
  sortFn_basic,
  tableFeatures,
  useTable,
} from '../dist/index.js';
const features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { basic: sortFn_basic },
});
interface Record {
  id: number;
  label: string;
  amount: number;
}
const helper = createColumnHelper<typeof features, Record>();
const columns = helper.columns([
  helper.accessor('label', { filterFn: 'includesString' }),
  helper.accessor('amount', { sortFn: 'basic' }),
]);
const results = [];
for (const count of [1000, 10000, 50000]) {
  const samples: { coreMs: number; sortMs: number; filterMs: number; cachedReadsMs: number }[] = [];
  for (let iteration = 0; iteration < 7; iteration++) {
    const scope = effectScope();
    const data = Array.from({ length: count }, (_, id) => ({
      id,
      label: `Record ${id}`,
      amount: (id * 7919) % count,
    }));
    const table = scope.run(() => useTable({ features, data, columns }))!;
    const start = performance.now();
    table.getRowModel();
    const coreMs = performance.now() - start;
    table.setSorting([{ id: 'amount', desc: true }]);
    const sortStart = performance.now();
    table.getRowModel();
    const sortMs = performance.now() - sortStart;
    table.getColumn('label')!.setFilterValue('1');
    const filterStart = performance.now();
    table.getRowModel();
    const filterMs = performance.now() - filterStart;
    const cachedStart = performance.now();
    for (let read = 0; read < 1000; read++) table.getRowModel();
    const cachedReadsMs = performance.now() - cachedStart;
    if (iteration > 1) samples.push({ coreMs, sortMs, filterMs, cachedReadsMs });
    scope.stop();
  }
  const median = (key: keyof (typeof samples)[number]) =>
    Number(
      samples
        .map((sample) => sample[key])
        .sort((a, b) => a - b)[2]
        .toFixed(3),
    );
  results.push({
    count,
    coreMs: median('coreMs'),
    sortMs: median('sortMs'),
    filterMs: median('filterMs'),
    cached1000ReadsMs: median('cachedReadsMs'),
  });
}
process.stdout.write(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      methodology:
        'Five samples after two warmups; medians. No DOM. Data allocation excluded; cold model reads measured separately.',
      results,
    },
    null,
    2,
  ) + '\n',
);
