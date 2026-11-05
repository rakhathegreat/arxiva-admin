"use client";

import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
} from "@tanstack/react-table";
import {
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
} from "@tabler/icons-react";
import { ArrowUpDown, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ScrollShadowWrapper } from "@/shared/ui/scroll-shadow";
import { Skeleton } from "@/shared/ui/skeleton";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { MoreVertical, X } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export interface RowAction<TData> {
	label: string;
	onClick: (row: TData) => void;
	icon?: LucideIcon | React.ComponentType<{ className?: string }>;
	destructive?: boolean;
	disabled?: boolean;
}

/**
 * Breakpoint container-query untuk menampilkan aksi inline.
 * Literal string — wajib agar Tailwind JIT mendeteksinya.
 */
const INLINE_BREAKPOINTS = {
	2: { show: "@[420px]:flex", hide: "@[420px]:hidden" },
	3: { show: "@[520px]:flex", hide: "@[520px]:hidden" },
	4: { show: "@[640px]:flex", hide: "@[640px]:hidden" },
} as const;

function getInlineBreakpoint(actionCount: number) {
	if (actionCount <= 2) return INLINE_BREAKPOINTS[2];
	if (actionCount === 3) return INLINE_BREAKPOINTS[3];
	return INLINE_BREAKPOINTS[4];
}

/**
 * Aksi baris adaptif: tiap aksi jadi tombol ikon saat kontainer tabel
 * cukup lebar; jika sempit, runtuh menjadi DropdownMenu (popover).
 */
function AdaptiveRowActions<TData>({ items, row }: { items: RowAction<TData>[]; row: TData }) {
	const moreThan3 = items.length > 3;
	const bp = getInlineBreakpoint(items.length);

	return (
		<>
			<div
				className={cn(
					"hidden items-center justify-center gap-1",
					moreThan3 ? "hidden" : bp.show,
				)}
			>
				{items.map((action) => (
					<Button
						key={action.label}
						variant="ghost"
						size="icon"
						disabled={action.disabled}
						className={cn(
							"size-8 cursor-pointer",
							action.destructive && "text-destructive hover:text-destructive",
						)}
						onClick={() => action.onClick(row)}
						title={action.label}
					>
						{action.icon && <action.icon className="size-4" />}
						<span className="sr-only">{action.label}</span>
					</Button>
				))}
			</div>

			<div className={cn("flex items-center justify-center", moreThan3 ? "flex" : bp.hide)}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon" className="size-6 cursor-pointer">
							<MoreVertical className="size-3.5" />
							<span className="sr-only">Buka menu aksi</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{items.map((action) => (
							<DropdownMenuItem
								key={action.label}
								disabled={action.disabled}
								className={
									action.destructive
										? "text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium gap-2"
										: "cursor-pointer text-xs gap-2"
								}
								onClick={() => action.onClick(row)}
							>
								{action.icon && <action.icon className="size-3.5" />}
								<span>{action.label}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</>
	);
}

/**
 * Kolom aksi baris seragam: tombol ikon terpisah bila ada ruang,
 * popover MoreVertical jika sempit.
 * `actions` bisa berupa daftar statis atau fungsi yang menentukan aksi per baris.
 */
export function createRowActionsColumn<TData>(
	actions: RowAction<TData>[] | ((row: TData) => RowAction<TData>[]),
): ColumnDef<TData> {
	return {
		id: "actions",
		header: () => <span className="block">Aksi</span>,
		cell: ({ row }) => {
			const items = typeof actions === "function" ? actions(row.original) : actions;
			if (items.length === 0) return null;
			return (
				<div className="flex items-center" onClick={(e) => e.stopPropagation()}>
					<AdaptiveRowActions items={items} row={row.original} />
				</div>
			);
		},
	};
}

export interface DataTableBulkAction {
	label: string;
	icon?: LucideIcon;
	destructive?: boolean;
	/** Jalankan aksi untuk daftar id baris terpilih. */
	onAction: (selectedIds: string[]) => Promise<void> | void;
}

export interface DataTableEmptyState {
	icon?: LucideIcon;
	title: string;
	description?: string;
	/** Ajakan bertindak — biasanya tombol tambah data. */
	action?: React.ReactNode;
}

export interface DataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
	data: TData[];
	/** Meta TanStack — dipakai kolom untuk mengakses callback domain. */
	meta?: Record<string, unknown>;
	isLoading?: boolean;
	emptyState?: DataTableEmptyState;
	onRowClick?: (row: TData) => void;
	pagination?: "client" | "server";
	totalItems?: number;
	page?: number;
	onPageChange?: (page: number) => void;
	pageSize?: number;
	onPageSizeChange?: (pageSize: number) => void;
	toolbar?: React.ReactNode;
	className?: string;
	/** Aktifkan kolom checkbox untuk memilih baris. */
	enableSelection?: boolean;
	/** Ekstrak id unik tiap baris (fallback: field `id`). */
	getRowId?: (row: TData) => string;
	/** Diberi tahu setiap kali set baris terpilih berubah. */
	onSelectionChange?: (selectedIds: string[]) => void;
	/** State baris terpilih eksternal (controlled). */
	rowSelection?: RowSelectionState;
	/** Callback saat state baris terpilih berubah (controlled). */
	onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
	/** Aksi massal yang tampil saat ada baris terpilih. */
	bulkActions?: DataTableBulkAction[];
	/** Aktifkan sorting pada header kolom (default: false). */
	enableSorting?: boolean;
}

const DEFAULT_EMPTY: DataTableEmptyState = {
	title: "Belum ada data.",
};

function TableSkeleton({
	columns,
	enableSelection,
}: {
	columns: number;
	enableSelection?: boolean;
}) {
	return (
		<>
			{Array.from({ length: 5 }).map((_, rowIndex) => (
				<TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
					{Array.from({ length: columns }).map((_, colIndex) => (
						<TableCell
							key={`skeleton-${rowIndex}-${colIndex}`}
							className={cn(
								"border border-border first:border-l-0 last:border-r-0",
								enableSelection && colIndex === 0 && "w-10 px-0 text-center border-x-0",
								enableSelection && colIndex === 1 && "border-l-0",
							)}
						>
							<Skeleton className="h-4 w-full max-w-32" />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}

function EmptyRow({ colSpan, emptyState }: { colSpan: number; emptyState: DataTableEmptyState }) {
	const Icon = emptyState.icon ?? Inbox;
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell colSpan={colSpan} className="p-0">
				<div
					className="flex min-h-42 flex-col items-center justify-center gap-4 px-6 py-16 text-center lg:min-h-80"
					role="status"
				>
					<div
						className="flex size-10 rounded-md items-center justify-center bg-muted"
						aria-hidden="true"
					>
						<Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
					</div>
					<div className="space-y-1">
						<h3 className="text-sm font-medium text-foreground">{emptyState.title}</h3>
						{emptyState.description && (
							<p className="mx-auto max-w-md text-sm text-muted-foreground">
								{emptyState.description}
							</p>
						)}
					</div>
					{emptyState.action}
				</div>
			</TableCell>
		</TableRow>
	);
}

export function DataTable<TData>({
	columns,
	data,
	meta,
	isLoading = false,
	emptyState = DEFAULT_EMPTY,
	onRowClick,
	pagination = "client",
	totalItems,
	page,
	onPageChange,
	pageSize,
	onPageSizeChange,
	toolbar,
	className,
	enableSelection = false,
	getRowId,
	onSelectionChange,
	rowSelection: controlledRowSelection,
	onRowSelectionChange: controlledOnRowSelectionChange,
	bulkActions,
	enableSorting = false,
}: DataTableProps<TData>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const isServer = pagination === "server";

	const [internalPagination, setInternalPagination] = React.useState({
		pageIndex: 0,
		pageSize: PAGE_SIZE_OPTIONS[0],
	});

	const effectivePageSize = isServer ? (pageSize ?? 10) : internalPagination.pageSize;

	const paginationState = isServer
		? { pageIndex: Math.max(0, (page ?? 1) - 1), pageSize: effectivePageSize }
		: internalPagination;

	const pageCount = isServer
		? Math.max(1, Math.ceil((totalItems ?? 0) / effectivePageSize))
		: undefined;

	const handlePaginationChange = React.useCallback(
		(
			updater:
				| { pageIndex: number; pageSize: number }
				| ((old: { pageIndex: number; pageSize: number }) => {
						pageIndex: number;
						pageSize: number;
				  }),
		) => {
			const next = typeof updater === "function" ? updater(paginationState) : updater;
			if (isServer) {
				onPageChange?.(next.pageIndex + 1);
				if (next.pageSize !== effectivePageSize) onPageSizeChange?.(next.pageSize);
			} else {
				setInternalPagination(next);
			}
		},
		[isServer, onPageChange, onPageSizeChange, paginationState, effectivePageSize],
	);

	const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
	const rowSelection = controlledRowSelection ?? internalRowSelection;
	const setRowSelection = controlledOnRowSelectionChange ?? setInternalRowSelection;
	const [isBulkRunning, setIsBulkRunning] = React.useState(false);

	const resolvedGetRowId = React.useCallback(
		(row: TData, index: number) => {
			if (getRowId) return getRowId(row);
			return String((row as { id?: unknown })?.id ?? index);
		},
		[getRowId],
	);

	const columnsWithSelection = React.useMemo(() => {
		if (!enableSelection) return columns;
		const selectColumn: ColumnDef<TData, any> = {
			id: "__select",
			header: ({ table: tbl }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={
							tbl.getIsAllPageRowsSelected() ||
							(tbl.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(v) => tbl.toggleAllPageRowsSelected(v === true)}
						aria-label="Pilih semua"
					/>
				</div>
			),
			cell: ({ row }) => (
				<div
					className="flex items-center justify-center"
					onClick={(e) => e.stopPropagation()}
				>
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(v) => row.toggleSelected(v === true)}
						aria-label="Pilih baris"
					/>
				</div>
			),
			enableSorting: false,
			meta: { className: "w-10 px-0 text-center" },
		};
		return [selectColumn, ...columns];
	}, [columns, enableSelection]);

	const table = useReactTable({
		data,
		columns: columnsWithSelection,
		enableRowSelection: enableSelection,
		getRowId: enableSelection ? resolvedGetRowId : undefined,
		onRowSelectionChange: enableSelection ? setRowSelection : undefined,
		getCoreRowModel: getCoreRowModel(),
		...(isServer ? {} : { getPaginationRowModel: getPaginationRowModel() }),
		...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
		onSortingChange: enableSorting ? setSorting : undefined,
		onColumnFiltersChange: setColumnFilters,
		enableSorting,
		state: {
			sorting: enableSorting ? sorting : [],
			columnFilters,
			pagination: paginationState,
			rowSelection: enableSelection ? rowSelection : {},
		},
		onPaginationChange: handlePaginationChange,
		manualPagination: isServer,
		pageCount,
		meta,
	});

	// Hitung selected IDs dari data halaman saat ini secara ringan,
	// menggantikan getSelectedRowModel() yang mengulang seluruh row model.
	const selectedIds = React.useMemo(() => {
		if (!enableSelection) return [];
		return data
			.filter((row) => rowSelection[resolvedGetRowId(row, 0)])
			.map((row) => resolvedGetRowId(row, 0));
	}, [data, rowSelection, enableSelection, resolvedGetRowId]);

	React.useEffect(() => {
		if (!enableSelection) return;
		onSelectionChange?.(selectedIds);
	}, [selectedIds, enableSelection, onSelectionChange]);

	const clearSelection = React.useCallback(() => setRowSelection({}), []);

	const totalRows = isServer ? (totalItems ?? 0) : table.getFilteredRowModel().rows.length;

	return (
		<div className={cn("@container", className ?? "flex flex-col w-full h-full min-h-0 gap-4")}>
			{toolbar}
			{enableSelection && !!bulkActions?.length && selectedIds.length > 0 && (
				<div
					role="toolbar"
					aria-label="Aksi massal"
					className="flex flex-wrap items-center gap-2 border border-border bg-muted/40 px-3 py-2"
				>
					<span className="text-xs font-medium text-foreground">
						{selectedIds.length} dipilih
					</span>
					<span className="h-4 w-px bg-border" />
					{bulkActions.map((action) => (
						<Button
							key={action.label}
							variant={action.destructive ? "destructive" : "outline"}
							size="sm"
							disabled={isBulkRunning}
							className="h-7 cursor-pointer gap-1.5 text-xs"
							onClick={async () => {
								setIsBulkRunning(true);
								try {
									await action.onAction(selectedIds);
									clearSelection();
								} finally {
									setIsBulkRunning(false);
								}
							}}
						>
							{action.icon && <action.icon className="size-3.5" />}
							{isBulkRunning ? "Memproses..." : action.label}
						</Button>
					))}
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto h-7 cursor-pointer gap-1 px-2 text-xs text-muted-foreground"
						onClick={clearSelection}
					>
						<X className="size-3.5" /> Bersihkan
					</Button>
				</div>
			)}
			<div>
				<ScrollShadowWrapper>
					<Table>
						<TableHeader className="sticky top-0 z-20 bg-transparent">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent">
									{headerGroup.headers.map((header, index) => {
										const isSelect = header.column.id === "__select";
										const isAfterSelect = enableSelection && index === 1;

										return (
											<TableHead
												key={header.id}
												className={cn(
													"first:border-l-0 last:border-r-0",
													isSelect && "w-10 px-0 text-center border-x-0",
													isAfterSelect && "border-l-0",
													(header.column.columnDef.meta as any)
														?.className,
												)}
											>
												{header.isPlaceholder ? null : typeof header.column
														.columnDef.header === "string" &&
												  header.column.getCanSort() ? (
													<button
														type="button"
														className={cn(
															"flex items-center gap-1 cursor-pointer select-none hover:text-foreground",
															(header.column.columnDef.meta as any)
																?.className,
														)}
														onClick={header.column.getToggleSortingHandler()}
													>
														{header.column.columnDef.header}
														<ArrowUpDown className="size-3.5 opacity-50" />
													</button>
												) : (
													<div
														className={
															(header.column.columnDef.meta as any)
																?.className
														}
													>
														{flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
													</div>
												)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableSkeleton
									columns={columnsWithSelection.length}
									enableSelection={enableSelection}
								/>
							) : table.getRowModel().rows.length > 0 ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										className="cursor-pointer transition-colors hover:bg-muted/40"
										onClick={() => onRowClick?.(row.original)}
									>
										{row.getVisibleCells().map((cell, cellIndex) => {
											const isSelect = cell.column.id === "__select";
											const isAfterSelect =
												enableSelection && cellIndex === 1;

											return (
												<TableCell
													key={cell.id}
													className={cn(
														"border border-border dark:border-muted first:border-l-0 last:border-r-0",
														isSelect && "w-10 px-0 text-center border-x-0",
														isAfterSelect && "border-l-0",
														(cell.column.columnDef.meta as any)
															?.className,
													)}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											);
										})}
									</TableRow>
								))
							) : (
								<EmptyRow
									colSpan={columnsWithSelection.length}
									emptyState={emptyState}
								/>
							)}
						</TableBody>
					</Table>
				</ScrollShadowWrapper>
			</div>

			{/* Pagination Controls */}
			{(totalRows > 0 || isServer) && !isLoading && (
				<div className="flex items-center justify-between px-4 py-4">
					<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
						Menampilkan{" "}
						{Math.min(paginationState.pageIndex * effectivePageSize + 1, totalRows)}–
						{Math.min((paginationState.pageIndex + 1) * effectivePageSize, totalRows)}{" "}
						dari {totalRows} data
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Baris per halaman
							</Label>
							<Select
								value={`${effectivePageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue placeholder={`${effectivePageSize}`} />
								</SelectTrigger>
								<SelectContent side="top">
									{PAGE_SIZE_OPTIONS.map((size) => (
										<SelectItem key={size} value={`${size}`}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Halaman {paginationState.pageIndex + 1} dari {table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Ke halaman pertama</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Ke halaman sebelumnya</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Ke halaman berikutnya</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Ke halaman terakhir</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
