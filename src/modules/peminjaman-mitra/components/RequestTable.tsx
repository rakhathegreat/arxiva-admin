import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/ui/badge";
import { toneFromLabel } from "@/shared/lib/tone";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { RoundedDataTable } from "@/shared/ui/data-table/RoundedDataTable";
import type { DataTableEmptyState } from "@/shared/ui/data-table/DataTable";
import type { InterMitraRequest } from "../types";

type RequestTableProps = {
	data: InterMitraRequest[];
	isLoading: boolean;
	actionId: string | null;
	onRowClick: (request: InterMitraRequest) => void;
	onApprove: (request: InterMitraRequest) => void;
	onReject: (request: InterMitraRequest) => void;
	className?: string;
};

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
};

const EMPTY_STATE: DataTableEmptyState = {
	title: "Belum ada daftar peminjaman antar mitra.",
};

export function RequestTable({
	data,
	isLoading,
	actionId,
	onRowClick,
	onApprove,
	onReject,
	className,
}: RequestTableProps) {
	const columns = React.useMemo<ColumnDef<InterMitraRequest, any>[]>(
		() => [
			{
				id: "nomor",
				header: () => <div className="pl-3">No.</div>,
				cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
			},
			{
				accessorKey: "requestNumber",
				header: "No. Permintaan",
				cell: ({ row }) => (
					<div className="text-primary font-medium">{row.original.requestNumber}</div>
				),
			},
			{
				accessorKey: "requestedAt",
				header: "Tanggal Masuk",
				cell: ({ row }) => (
					<div className="text-muted-foreground whitespace-nowrap">
						{row.original.requestedAt
							? new Date(row.original.requestedAt).toLocaleDateString(
									"en-GB",
									DATE_FORMAT_OPTIONS,
								)
							: "-"}
					</div>
				),
			},
			{
				accessorKey: "requesterName",
				header: "Peminta",
				cell: ({ row }) => (
					<div className="text-foreground font-medium">
						{row.original.requesterName || "-"}
					</div>
				),
			},
			{
				accessorKey: "partnerCategory",
				header: "Kategori",
				cell: ({ row }) =>
					row.original.partnerCategory ? (
						<Badge
							variant="quiet"
							size="sm"
							tone={toneFromLabel(row.original.partnerCategory)}
							className="capitalize"
						>
							{row.original.partnerCategory.toLowerCase()}
						</Badge>
					) : (
						<span className="text-muted-foreground">-</span>
					),
			},
			{
				accessorKey: "providerName",
				header: "Mitra Pemberi",
				cell: ({ row }) => (
					<div className="text-foreground">{row.original.providerName || "-"}</div>
				),
			},
			{
				accessorKey: "itemsDetail",
				header: "Detail Barang",
				cell: ({ row }) => (
					<div
						className="max-w-64 truncate text-muted-foreground"
						title={row.original.itemsDetail || undefined}
					>
						{row.original.itemsDetail || "-"}
					</div>
				),
			},
			{
				accessorKey: "itemsCount",
				header: () => <div className="text-center">Jumlah</div>,
				cell: ({ row }) => (
					<div className="text-center text-muted-foreground">
						{row.original.itemsCount ?? 0}
					</div>
				),
			},
			{
				accessorKey: "status",
				header: () => <div className="text-center">Status</div>,
				cell: ({ row }) => (
					<div className="flex items-center justify-center">
						<StatusBadge status={row.original.status} size="sm" />
					</div>
				),
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const pending = row.original.status.toUpperCase() === "MENUNGGU";
					const busy = actionId === row.original.id;
					return (
						<div
							className="flex justify-end gap-1.5"
							onClick={(e) => e.stopPropagation()}
						>
							{pending && (
								<>
									<Button
										size="sm"
										variant="default"
										className="h-7 cursor-pointer px-2.5 text-xs font-medium"
										disabled={busy}
										onClick={() => onApprove(row.original)}
									>
										{busy && <Loader2 className="size-3 animate-spin mr-1" />}
										Setujui
									</Button>
									<Button
										size="sm"
										variant="destructive"
										className="h-7 cursor-pointer px-2.5 text-xs font-medium"
										disabled={busy}
										onClick={() => onReject(row.original)}
									>
										Tolak
									</Button>
								</>
							)}
							{!pending && (
								<Button
									size="sm"
									variant="outline"
									className="h-7 cursor-pointer px-2.5 text-xs font-medium"
									onClick={() => onRowClick(row.original)}
								>
									Detail
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[actionId, onApprove, onReject, onRowClick],
	);

	return (
		<RoundedDataTable<InterMitraRequest>
			data={data}
			columns={columns}
			isLoading={isLoading}
			getRowId={(row) => row.id}
			onRowClick={onRowClick}
			emptyState={EMPTY_STATE}
			className={className}
		/>
	);
}
