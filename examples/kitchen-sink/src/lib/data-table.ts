import type {
  ReadonlyAtom,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  ColumnVisibilityState,
  ColumnSizingState,
  Updater,
  TextContent,
} from '@usevibejs/table';

/** Vibe components cannot declare generic parameters. These covariant views preserve feature optionality. */
export type DataTableTemplate = TextContent | ((context: never) => unknown);
export interface DataTableColumn {
  id: string;
  columnDef: {
    header?: DataTableTemplate;
    cell?: DataTableTemplate;
    aggregatedCell?: DataTableTemplate;
    minSize?: number;
    maxSize?: number;
  };
  getCanSort?: () => boolean;
  getIsSorted?: () => false | 'asc' | 'desc';
  toggleSorting?: (desc?: boolean, multi?: boolean) => void;
  clearSorting?: () => void;
  getCanHide?: () => boolean;
  getIsVisible?: () => boolean;
  toggleVisibility?: (visible?: boolean) => void;
  getCanResize?: () => boolean;
  getSize?: () => number;
  getFilterValue?: () => unknown;
  setFilterValue?: (updater: unknown) => void;
  getFacetedUniqueValues?: () => Map<unknown, number>;
}
export interface DataTableCell {
  id: string;
  column: DataTableColumn;
  getContext: () => object;
  getValue: () => unknown;
  getIsAggregated?: () => boolean;
  getIsPlaceholder?: () => boolean;
}
export interface DataTableRow {
  id: string;
  original: unknown;
  depth: number;
  getAllCells: () => DataTableCell[];
  getVisibleCells?: () => DataTableCell[];
  getIsSelected?: () => boolean;
  getCanSelect?: () => boolean;
  toggleSelected?: (value?: boolean) => void;
  getCanExpand?: () => boolean;
  getIsExpanded?: () => boolean;
  toggleExpanded?: (value?: boolean) => void;
}
export interface DataTableHeader {
  id: string;
  colSpan: number;
  rowSpan: number;
  isPlaceholder: boolean;
  column: DataTableColumn;
  getContext: () => object;
  getResizeHandler?: (context?: Document) => (event: unknown) => void;
}
export interface DataTableInstance {
  atoms: {
    pagination?: ReadonlyAtom<PaginationState>;
    sorting?: ReadonlyAtom<SortingState>;
    globalFilter?: ReadonlyAtom<unknown>;
    columnFilters?: ReadonlyAtom<ColumnFiltersState>;
    columnVisibility?: ReadonlyAtom<ColumnVisibilityState>;
  };
  getHeaderGroups: () => { id: string; headers: DataTableHeader[] }[];
  getRowModel: () => { rows: DataTableRow[] };
  getAllLeafColumns: () => DataTableColumn[];
  getVisibleLeafColumns?: () => DataTableColumn[];
  getRowCount?: () => number;
  getPageCount?: () => number;
  getCanNextPage?: () => boolean;
  getCanPreviousPage?: () => boolean;
  getCanLastPage?: () => boolean;
  nextPage?: () => void;
  previousPage?: () => void;
  setPageIndex?: (index: number) => void;
  setPageSize?: (size: number) => void;
  setGlobalFilter?: (filter: unknown) => void;
  resetColumnFilters?: () => void;
  getSelectedRowIds?: () => string[];
  getFilteredSelectedRowModel?: () => { rows: DataTableRow[] };
  resetRowSelection?: () => void;
  setColumnSizing?: (updater: Updater<ColumnSizingState>) => void;
}
