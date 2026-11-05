import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/utils";
import type { DistributionSlice } from "../utils/materialStats";

export interface MaterialSummaryData {
	total: number;
	statusCounts: DistributionSlice[];
	kategoriTop: DistributionSlice[];
	merekTop: DistributionSlice[];
}

interface MaterialSummaryProps {
	data: MaterialSummaryData | null;
	isLoading: boolean;
	error: string | null;
	onRetry: () => void;
}

const MAX_ROWS = 5;

function DistributionList({
	items,
	emptyLabel,
	showStatus = false,
}: {
	items: DistributionSlice[];
	emptyLabel: string;
	showStatus?: boolean;
}) {
	const rows = items.slice(0, MAX_ROWS);
	const max = rows.reduce((a, row) => Math.max(a, row.jumlah), 0) || 1;

	if (rows.length === 0) {
		return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
	}

	return (
		<ul className="flex flex-col">
			{rows.map((row) => (
				<li key={row.name} className="py-1.5 first:pt-0 last:pb-0">
					<div className="flex items-baseline justify-between gap-3">
						{showStatus ? (
							<StatusBadge size="sm" status={row.name} />
						) : (
							<span className="min-w-0 truncate text-xs text-foreground/80" title={row.name}>
								{row.name}
							</span>
						)}
						<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
							{row.jumlah.toLocaleString("id-ID")}
						</span>
					</div>
					<div
						aria-hidden
						className="mt-1.5 h-px w-full overflow-hidden rounded-full bg-border">
						<div
							className="h-full rounded-full bg-foreground/35"
							style={{ width: `${Math.max(3, Math.round((row.jumlah / max) * 100))}%` }}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}

function Column({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-2.5 px-4 py-4 first:pl-4 md:px-5 md:first:pl-5">
			<h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
				{title}
			</h3>
			{children}
		</div>
	);
}

function ColumnSkeleton() {
	return (
		<div className="flex flex-col gap-2.5">
			{[1, 2, 3].map((i) => (
				<div key={i} className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between gap-3">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-3 w-6" />
					</div>
					<Skeleton className="h-px w-full" />
				</div>
			))}
		</div>
	);
}

/** Ringkasan material di gudang KP: total, sebaran status, kategori, dan merek. */
export function MaterialSummary({ data, isLoading, error, onRetry }: MaterialSummaryProps) {
	return (
		<section aria-labelledby="ringkasan-material" className="flex flex-col gap-3">
			<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
				<div className="flex flex-col gap-1">
					<h2 id="ringkasan-material" className="text-sm font-medium text-foreground">
						Isi gudang
					</h2>
					<p className="text-xs text-muted-foreground">
						{isLoading ? (
							"Memuat ringkasan material…"
						) : error ? (
							"Ringkasan material gagal dimuat."
						) : (
							<>
								<span className="tabular-nums text-foreground">
									{(data?.total ?? 0).toLocaleString("id-ID")} unit
								</span>{" "}
								material tercatat di gudang KP.
							</>
						)}
					</p>
				</div>

				<div className="flex items-center gap-1">
					{error && !isLoading && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRetry}
							className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground">
							<RefreshCw className="size-3.5" /> Coba lagi
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="cursor-pointer gap-1 text-xs font-normal text-muted-foreground hover:text-foreground">
						<Link to="/data-barang">
							Data Material <ArrowUpRight className="size-3.5" />
						</Link>
					</Button>
				</div>
			</div>

			<Card
				className={cn(
					"grid gap-0 divide-y divide-border py-0 md:grid-cols-3 md:divide-x md:divide-y-0",
					error && !isLoading && "opacity-60",
				)}>
				<Column title="Status material">
					{isLoading ? (
						<ColumnSkeleton />
					) : (
						<DistributionList
							items={data?.statusCounts ?? []}
							emptyLabel="Belum ada material tercatat."
							showStatus
						/>
					)}
				</Column>
				<Column title="Kategori terbanyak">
					{isLoading ? (
						<ColumnSkeleton />
					) : (
						<DistributionList
							items={data?.kategoriTop ?? []}
							emptyLabel="Belum ada kategori tercatat."
						/>
					)}
				</Column>
				<Column title="Merek terbanyak">
					{isLoading ? (
						<ColumnSkeleton />
					) : (
						<DistributionList
							items={data?.merekTop ?? []}
							emptyLabel="Belum ada merek tercatat."
						/>
					)}
				</Column>
			</Card>
		</section>
	);
}
