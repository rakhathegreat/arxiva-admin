"use client";

import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ScrollShadowWrapper } from "@/shared/ui/scroll-shadow";
import { Skeleton } from "@/shared/ui/skeleton";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { RowSelectionState } from "@tanstack/react-table";
import type { DataTableEmptyState } from "@/shared/ui/data-table/DataTable";

export type { DataTableEmptyState };

export interface RoundedDataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
	data: TData[];
	/** Meta TanStack — dipakai kolom untuk mengakses callback domain. */
	meta?: Record<string, unknown>;
	isLoading?: boolean;
	emptyState?: DataTableEmptyState;
	onRowClick?: (row: TData) => void;
	toolbar?: React.ReactNode;
	className?: string;
	/** Aktifkan kolom checkbox untuk memilih baris. */
	enableSelection?: boolean;
	/** Ekstrak id unik tiap baris (fallback: field `id`). */
	getRowId?: (row: TData) => string;
	/** State baris terpilih eksternal (controlled). */
	rowSelection?: RowSelectionState;
	/** Callback saat state baris terpilih berubah (controlled). */
	onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
	/** Aktifkan sorting pada header kolom (default: false). */
	enableSorting?: boolean;
}

const DEFAULT_EMPTY: DataTableEmptyState = {
	title: "Belum ada data.",
};

function RoundedTableSkeleton({ columns }: { columns: number }) {
	return (
		<>
			{Array.from({ length: 5 }).map((_, rowIndex) => (
				<TableRow
					key={`skeleton-${rowIndex}`}
					className="hover:bg-transparent border-b border-border/60 last:border-b-0"
				>
					{Array.from({ length: columns }).map((_, colIndex) => (
						<TableCell
							key={`skeleton-${rowIndex}-${colIndex}`}
							className="border-0 border-b border-border/60 px-3 py-2.5"
						>
							<Skeleton className="h-4 w-full max-w-32" />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}

function RoundedEmptyRow({
	colSpan,
	emptyState,
}: {
	colSpan: number;
	emptyState: DataTableEmptyState;
}) {
	const Icon = emptyState.icon ?? Inbox;
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell colSpan={colSpan} className="border-0 p-0">
				<div
					className="flex min-h-100 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
					role="status"
				>
					<div
						className="flex size-10 rounded-lg items-center justify-center bg-muted"
						aria-hidden="true"
					>
						<Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground/70">{emptyState.title}</p>
						{emptyState.description && (
							<p className="mx-auto max-w-sm text-xs">{emptyState.description}</p>
						)}
					</div>
					{emptyState.action}
				</div>
			</TableCell>
		</TableRow>
	);
}

/**
 * RoundedDataTable — tabel dengan desain rounded container, header bg-accent/50,
 * dan hanya menggunakan border-bottom (tanpa border vertikal).
 * Tidak memiliki pagination — cocok untuk daftar ringkas.
 */
export function RoundedDataTable<TData>({
	columns,
	data,
	meta,
	isLoading = false,
	emptyState = DEFAULT_EMPTY,
	onRowClick,
	toolbar,
	className,
	enableSelection = false,
	getRowId,
	rowSelection: controlledRowSelection,
	onRowSelectionChange: controlledOnRowSelectionChange,
	enableSorting = false,
}: RoundedDataTableProps<TData>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
	const rowSelection = controlledRowSelection ?? internalRowSelection;
	const setRowSelection = controlledOnRowSelectionChange ?? setInternalRowSelection;

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
				<div className="flex justify-center">
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
				<div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(v) => row.toggleSelected(v === true)}
						aria-label="Pilih baris"
					/>
				</div>
			),
			enableSorting: false,
			meta: { className: "w-10 text-center" },
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
		...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
		onSortingChange: enableSorting ? setSorting : undefined,
		enableSorting,
		state: {
			sorting: enableSorting ? sorting : [],
			rowSelection: enableSelection ? rowSelection : {},
		},
		meta,
	});

	return (
		<div className={cn("@container flex flex-col gap-3", className)}>
			{toolbar}
			<div className="overflow-hidden rounded-md border border-border/50 bg-card">
				<ScrollShadowWrapper>
					<Table>
						<TableHeader className="sticky top-0 z-20 backdrop-blur-sm">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent">
									{headerGroup.headers.map((header) => {
										const isSelect = header.column.id === "__select";
										return (
											<TableHead
												key={header.id}
												className={cn(
													"h-10 border-0 border-b border-border text-sm text-muted-foreground px-0",
													isSelect && "w-10",
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
														<ArrowUpDown className="size-3 opacity-50" />
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
								<RoundedTableSkeleton columns={columnsWithSelection.length} />
							) : table.getRowModel().rows.length > 0 ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										className="cursor-pointer transition-colors hover:bg-muted/40 border-b border-border/60 last:border-b-0"
										onClick={() => onRowClick?.(row.original)}
									>
										{row.getVisibleCells().map((cell) => {
											const isSelect = cell.column.id === "__select";
											return (
												<TableCell
													key={cell.id}
													className={cn(
														"border-0 border-b border-border/60 px-3 py-2.5 text-xs whitespace-nowrap",
														isSelect && "w-10",
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
								<RoundedEmptyRow
									colSpan={columnsWithSelection.length}
									emptyState={emptyState}
								/>
							)}
						</TableBody>
					</Table>
				</ScrollShadowWrapper>
			</div>
		</div>
	);
}
