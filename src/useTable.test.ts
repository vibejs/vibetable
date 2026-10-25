import {
  computed,
  effectScope,
  nextTick,
  reactive,
  ref,
  shallowRef,
  watchEffect,
} from '@usevibejs/ui';
import { createAtom, type Observer } from '@tanstack/store';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  functionalUpdate,
  useTableAtom,
  createSortedRowModel,
} from './index.ts';
import type { PaginationState, SortingState, TableOptions } from './index.ts';
import { columns, features, people, scoped } from '../test/helpers.ts';
import type { Person } from '../test/helpers.ts';

const make = (options: Partial<TableOptions<typeof features, Person>> = {}) =>
  useTable({
    features,
    data: people,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    ...options,
  });
const names = (table: ReturnType<typeof make>) =>
  table.getRowModel().rows.map((row) => row.original.name);

describe('native options and lifecycle', () => {
  it('requires an active owner', () => {
    expect(() => make()).toThrow('active component or effect scope');
    const stopped = effectScope();
    stopped.stop();
    expect(stopped.active).toBe(false);
  });
  it('creates stable rows, cells, headers, and context with inferred data', () =>
    scoped(() => {
      const table = make();
      expect(names(table)).toEqual(['Ada', 'Grace', 'Linus', 'Alan']);
      expect(table.getRowModel()).toBe(table.getRowModel());
      expect(table.getRow('a').getValue('age')).toBe(36);
      expect(table.getHeaderGroups()[0].headers.map((h) => h.column.id)).toEqual([
        'name',
        'age',
        'team',
        'date',
      ]);
      expect(table.getRow('a').getAllCells()[0].getContext().row.original).toBe(people[0]);
      expectTypeOf(table.getRow('a').original).toEqualTypeOf<Person>();
    }));
  it('replaces data, columns and scalar options without replacing the instance', () =>
    scoped(() => {
      const data = shallowRef(people);
      const enabled = ref(true);
      const defs = shallowRef(columns);
      const table = useTable(() => ({
        features,
        data,
        columns: computed(() => defs.value),
        getRowId: (row: Person) => row.id,
        enableRowSelection: enabled.value,
      }));
      const rows = computed(() => table.getRowModel().rows);
      const original = table;
      expect(rows.value).toHaveLength(4);
      data.value = [{ ...people[0], name: 'Augusta' }];
      expect(rows.value[0].original.name).toBe('Augusta');
      expect(rows.value).toHaveLength(1);
      enabled.value = false;
      expect(table.getRow('a').getCanSelect()).toBe(false);
      defs.value = columns.slice(0, 2) as typeof columns;
      expect(table.getAllLeafColumns()).toHaveLength(2);
      expect(table).toBe(original);
    }));
  it('supports whole-options refs and reactive objects, drops removed controlled state', () =>
    scoped(() => {
      const state = reactive<{ sorting?: SortingState }>({ sorting: [{ id: 'age', desc: false }] });
      const input = shallowRef({ features, data: people, columns, state });
      const table = useTable(input);
      expect(table.atoms.sorting.get()).toEqual(state.sorting);
      state.sorting = [{ id: 'age', desc: true }];
      expect(table.atoms.sorting.get()[0].desc).toBe(true);
      delete state.sorting;
      table.setSorting([{ id: 'name', desc: false }]);
      expect(table.atoms.sorting.get()[0].id).toBe('name');
      input.value = { ...input.value, data: people.slice(1) };
      expect(table.getRowModel().rows).toHaveLength(3);
    }));
  it('stops option sources and atom observers with the owning scope', () => {
    const scope = effectScope();
    const data = shallowRef(people);
    const observer = vi.fn<(value: SortingState) => void>();
    const table = scope.run(() => useTable({ features, data, columns }))!;
    scope.run(() => table.atoms.sorting.subscribe(observer));
    table.setSorting([{ id: 'age', desc: false }]);
    expect(observer).toHaveBeenCalledTimes(1);
    scope.stop();
    table.setSorting([]);
    expect(observer).toHaveBeenCalledTimes(1);
    const subscription = table.atoms.sorting.subscribe(observer);
    subscription.unsubscribe();
    expect(observer).toHaveBeenCalledTimes(1);
  });
  it('disposes the bridge if construction fails', () =>
    scoped(() => {
      const options = {
        features,
        data: people,
        columns,
        get initialState(): never {
          throw new Error('configuration');
        },
      };
      expect(() => useTable(options)).toThrow('configuration');
    }));
});

describe('row-model pipeline', () => {
  it('sorts ascending, descending and multiple columns, including custom functions', () =>
    scoped(() => {
      const table = make();
      table.setSorting([
        { id: 'age', desc: false },
        { id: 'name', desc: false },
      ]);
      expect(names(table)).toEqual(['Linus', 'Ada', 'Alan', 'Grace']);
      table.getColumn('age')!.toggleSorting(true);
      expect(names(table)[0]).toBe('Grace');
      table.setSorting([]);
      expect(names(table)[0]).toBe('Ada');
      const f = tableFeatures({
        rowSortingFeature,
        sortedRowModel: createSortedRowModel(),
        sortFns: {
          length: (
            a: { getValue: (id: string) => string },
            b: { getValue: (id: string) => string },
            id: string,
          ) => a.getValue(id).length - b.getValue(id).length,
        },
      });
      const custom = useTable({
        features: f,
        data: people,
        columns: [{ accessorKey: 'name', sortFn: 'length' }],
      });
      custom.setSorting([{ id: 'name', desc: true }]);
      expect(custom.getRowModel().rows[0].original.name).toBe('Grace');
    }));
  it('filters text, number ranges, dates, global search, facets, and custom predicates', () =>
    scoped(() => {
      const table = make();
      table.getColumn('name')!.setFilterValue('al');
      expect(names(table)).toEqual(['Alan']);
      table.resetColumnFilters();
      table.getColumn('age')!.setFilterValue([35, 40]);
      expect(names(table)).toEqual(['Ada', 'Alan']);
      expect(table.getColumn('age')!.getFacetedMinMaxValues()).toEqual([30, 45]);
      expect(table.getColumn('team')!.getFacetedUniqueValues().get('Engineering')).toBe(1);
      table.resetColumnFilters();
      table.setGlobalFilter('grace');
      expect(names(table)).toEqual(['Grace']);
      table.setGlobalFilter('');
      table.getColumn('date')!.setFilterValue([new Date('2026-02-01'), new Date('2026-03-15')]);
      expect(names(table)).toEqual(['Grace', 'Linus']);
      const custom = make({
        columns: [
          {
            accessorKey: 'age',
            filterFn: (row, id, value: number) => row.getValue<number>(id) % value === 0,
          },
        ],
      });
      custom.getColumn('age')!.setFilterValue(5);
      expect(custom.getRowModel().rows).toHaveLength(2);
    }));
  it('paginates, navigates, resizes pages and resets state', () =>
    scoped(() => {
      const table = make({ initialState: { pagination: { pageIndex: 0, pageSize: 2 } } });
      expect(names(table)).toEqual(['Ada', 'Grace']);
      expect(table.getPageCount()).toBe(2);
      table.nextPage();
      expect(names(table)).toEqual(['Linus', 'Alan']);
      expect(table.getCanNextPage()).toBe(false);
      table.previousPage();
      expect(table.getCanPreviousPage()).toBe(false);
      table.setPageSize(3);
      expect(names(table)).toHaveLength(3);
      table.resetPagination();
      expect(table.atoms.pagination.get().pageSize).toBe(2);
    }));
  it('preserves manual server rows and supplied counts', () =>
    scoped(() => {
      const table = make({
        data: people.slice(0, 2),
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        rowCount: 42,
        initialState: { pagination: { pageIndex: 1, pageSize: 2 } },
      });
      table.setSorting([{ id: 'age', desc: true }]);
      table.setGlobalFilter('unmatched');
      expect(names(table)).toEqual(['Ada', 'Grace']);
      expect(table.getPageCount()).toBe(21);
      expect(table.getRowCount()).toBe(42);
      table.setOptions((previous) => ({ ...previous, pageCount: -1 }));
      expect(table.getCanNextPage()).toBe(true);
    }));
  it('selects rows, select-all and single selection using stable IDs', () =>
    scoped(() => {
      const table = make();
      table.getRow('a').toggleSelected();
      expect(table.getSelectedRowIds()).toEqual(['a']);
      expect(table.getIsSomeRowsSelected()).toBe(true);
      table.toggleAllPageRowsSelected(true);
      expect(table.getIsAllPageRowsSelected()).toBe(true);
      table.toggleAllRowsSelected(false);
      expect(table.getSelectedRowModel().rows).toHaveLength(0);
      table.setOptions((previous) => ({ ...previous, enableMultiRowSelection: false }));
      table.getRow('a').toggleSelected();
      table.getRow('b').toggleSelected();
      expect(table.getSelectedRowIds()).toEqual(['b']);
    }));
  it('updates visibility, order, pinning and sizing independently', () =>
    scoped(() => {
      const table = make();
      const row = table.getRow('a');
      table.getColumn('age')!.toggleVisibility(false);
      expect(row.getVisibleCells().map((c) => c.column.id)).toEqual(['name', 'team', 'date']);
      table.setColumnOrder(['date', 'team', 'name', 'age']);
      expect(row.getVisibleCells()[0].column.id).toBe('date');
      table.getColumn('name')!.pin('start');
      expect(table.getStartLeafColumns()[0].id).toBe('name');
      table.setColumnSizing({ name: 240 });
      expect(table.getColumn('name')!.getSize()).toBe(240);
      table.setColumnResizing((old) => ({ ...old, isResizingColumn: 'name' }));
      expect(table.getColumn('name')!.getIsResizing()).toBe(true);
      row.pin('top');
      expect(table.getTopRows()[0].id).toBe('a');
    }));
  it('groups and aggregates, expands hierarchical subrows, and builds grouped headers', () =>
    scoped(() => {
      const table = make();
      table.setGrouping(['team']);
      const grouped = table.getRowModel().rows;
      expect(grouped).toHaveLength(2);
      expect(grouped[0].getValue('age')).toBe(81);
      grouped[0].toggleExpanded();
      expect(table.getRowModel().rows).toHaveLength(4);
      const tree = make({
        data: [{ ...people[0], children: [people[1]] }],
        getSubRows: (row) => row.children,
      });
      expect(tree.getRowModel().rows).toHaveLength(1);
      tree.getRow('a').toggleExpanded();
      expect(tree.getRowModel().rows).toHaveLength(2);
      const groupedHeaders = make({
        columns: [
          { header: 'Identity', columns: columns.slice(0, 2) },
          { accessorKey: 'team', header: 'Team' },
        ],
      });
      expect(groupedHeaders.getHeaderGroups()).toHaveLength(2);
      expect(groupedHeaders.getHeaderGroups()[0].headers[0].colSpan).toBe(2);
    }));
});

describe('controlled state and fine-grained updates', () => {
  it('handles value and function updaters for controlled refs, computed refs and getters', () =>
    scoped(() => {
      const sorting = shallowRef<SortingState>([]);
      const pagination = shallowRef<PaginationState>({ pageIndex: 0, pageSize: 2 });
      const table = useTable({
        features,
        data: () => people,
        columns: () => columns,
        state: computed(() => ({ sorting, pagination: () => pagination.value })),
        onSortingChange: (updater) => {
          sorting.value = functionalUpdate(updater, sorting.value);
        },
        onPaginationChange: (updater) => {
          pagination.value = functionalUpdate(updater, pagination.value);
        },
        autoResetPageIndex: false,
      });
      table.setSorting([{ id: 'age', desc: true }]);
      expect(sorting.value[0].desc).toBe(true);
      expect(table.getRowModel().rows[0].original.name).toBe('Grace');
      table.nextPage();
      expect(pagination.value.pageIndex).toBe(1);
      sorting.value = [];
      expect(table.atoms.sorting.get()).toEqual([]);
    }));
  it('keeps controlled slices frozen without callbacks and preserves uncontrolled slices', () =>
    scoped(() => {
      const table = make({ state: { sorting: [] } });
      table.setSorting([{ id: 'age', desc: true }]);
      expect(table.atoms.sorting.get()).toEqual([]);
      table.getRow('a').toggleSelected();
      expect(table.atoms.rowSelection.get()).toEqual({ a: true });
      table.setOptions((previous) => ({ ...previous, state: { sorting: undefined } }));
      expect(table.atoms.sorting.get()).toEqual([]);
    }));
  it('bridges external Store atoms bidirectionally, with precedence and no config mutation', () => {
    const scope = effectScope();
    const external = createAtom<SortingState>([]);
    const atomMap = { sorting: external };
    const observer = vi.fn<(value: SortingState) => void>();
    const table = scope.run(() => make({ atoms: atomMap, state: { sorting: [] } }))!;
    scope.run(() => watchEffect(() => observer(table.atoms.sorting.get())));
    external.set([{ id: 'age', desc: true }]);
    expect(table.atoms.sorting.get()[0].desc).toBe(true);
    table.setSorting((old) => [...old, { id: 'name', desc: false }]);
    expect(external.get()).toHaveLength(2);
    expect(atomMap.sorting).toBe(external);
    expect(observer).toHaveBeenCalledTimes(1);
    scope.stop();
    external.set([]);
    expect(table.atoms.sorting.get()).toHaveLength(2);
  });
  it('supports native external atoms and explicit subscription disposal', () =>
    scoped(() => {
      const sorting = useTableAtom<SortingState>([]);
      const table = make({ atoms: { sorting } });
      const observer = vi.fn<(value: SortingState) => void>();
      const sub = table.atoms.sorting.subscribe(observer);
      table.setSorting([{ id: 'name', desc: false }]);
      expect(observer).toHaveBeenCalledOnce();
      expect(sorting.get()).toEqual(table.atoms.sorting.get());
      sub.unsubscribe();
      table.setSorting([]);
      expect(observer).toHaveBeenCalledOnce();
    }));
  it('tracks only state used by row models and cells without feedback loops', async () => {
    const scope = effectScope();
    const data = shallowRef(people);
    const reads = { options: 0, rows: 0, selected: 0, page: 0 };
    const table = scope.run(() => {
      const result = useTable(() => {
        reads.options++;
        return { features, data, columns, getRowId: (row: Person) => row.id };
      });
      watchEffect(() => {
        result.getRowModel();
        reads.rows++;
      });
      watchEffect(() => {
        result.getRow('a').getIsSelected();
        reads.selected++;
      });
      watchEffect(() => {
        result.getPageCount();
        reads.page++;
      });
      return result;
    })!;
    await nextTick();
    const baseline = { ...reads };
    table.getRow('a').toggleSelected();
    await nextTick();
    expect(reads.options).toBe(baseline.options);
    expect(reads.rows).toBe(baseline.rows);
    expect(reads.page).toBe(baseline.page);
    expect(reads.selected).toBe(baseline.selected + 1);
    data.value = people.slice(0, 2);
    await nextTick();
    expect(table.getRowModel().rows).toHaveLength(2);
    scope.stop();
    const last = reads.options;
    data.value = people;
    await nextTick();
    expect(reads.options).toBe(last);
  });
  it('registers only chosen features and handles 50,000 rows with memoized reads', () =>
    scoped(() => {
      const f = tableFeatures({ rowSelectionFeature, rowPaginationFeature });
      const table = useTable({
        features: f,
        data: Array.from({ length: 50000 }, (_, id) => ({ id, value: id })),
        columns: [{ accessorKey: 'value' }],
      });
      expect(Object.keys(table.atoms).sort()).toEqual(['pagination', 'rowSelection']);
      const model = table.getRowModel();
      expect(model.rows).toHaveLength(50000);
      table.getRow('0').toggleSelected();
      expect(table.getRowModel()).toBe(model);
      expectTypeOf(table.atoms.pagination.get()).toEqualTypeOf<PaginationState>();
    }));
});

it('exposes reactive cell ranges and cell spanning from v9 features', () =>
  scoped(() => {
    const table = make({
      columns: [{ accessorKey: 'team', spanRows: true }, { accessorKey: 'name' }],
    });
    table.selectCellRange({
      anchorRowId: 'a',
      anchorColumnId: 'team',
      focusRowId: 'b',
      focusColumnId: 'name',
    });
    expect(table.getSelectedCellCount()).toBe(3);
    expect(table.getRow('a').getAllCells()[0].getIsSelected()).toBe(true);
    expect(table.getRow('a').getAllCells()[0].getRowSpan()).toBe(2);
    expect(table.getRow('b').getAllCells()[0].getIsCovered()).toBe(true);
    table.resetCellSelection();
    expect(table.getSelectedCellCount()).toBe(0);
  }));

it('releases external subscriptions when a feature fails during construction', () =>
  scoped(() => {
    const external = createAtom<SortingState>([]);
    const original = external.subscribe.bind(external);
    let active = 0;
    external.subscribe = (observer: Observer<SortingState> | ((value: SortingState) => void)) => {
      active++;
      const subscription = typeof observer === 'function' ? original(observer) : original(observer);
      return {
        unsubscribe() {
          active--;
          subscription.unsubscribe();
        },
      };
    };
    const broken = tableFeatures({
      rowSortingFeature: {
        ...rowSortingFeature,
        initTableInstanceData() {
          throw new Error('feature failed');
        },
      },
    });
    expect(() =>
      useTable({ features: broken, data: people, columns: [], atoms: { sorting: external } }),
    ).toThrow('feature failed');
    expect(active).toBe(0);
  }));
