import { cn } from "@/shared/lib/utils";
import type { LokasiStats } from "../utils/lokasi";

const SEGMENT_MIN_LABEL_PCT = 18;

interface Segment {
	key: string;
	pct: number;
	bar: string;
	text: string;
}

interface Cell {
	key: string;
	label: string;
	dot: string;
	used: number;
	capacity: number;
	meta: string;
}

/**
 * Kapasitas gudang KP sebagai satu bar tersegmentasi, dengan rincian
 * tiap tipe penyimpanan di bawahnya. Data, bukan dekorasi.
 */
export function WarehouseSummary({
	stats,
	isLoading = false,
	activeType,
	onSelectType,
}: {
	stats: LokasiStats;
	isLoading?: boolean;
	activeType?: "rak" | "kardus" | "pallet" | string;
	onSelectType?: (type: "rak" | "kardus" | "pallet") => void;
}) {
	const total = stats.maxCapacity || 1;
	const hasCapacity = stats.maxCapacity > 0;
	const freeUnits = Math.max(0, stats.maxCapacity - stats.usedCapacity);

	const segments: Segment[] = [
		{ key: "Rak", used: stats.rakUsed, bar: "bg-chart-1", text: "text-background" },
		{ key: "Kardus", used: stats.kardusUsed, bar: "bg-chart-2", text: "text-background" },
		{ key: "Pallet", used: stats.palletUsed, bar: "bg-chart-3", text: "text-foreground" },
	]
		.map((segment) => ({ ...segment, pct: Math.round((segment.used / total) * 100) }))
		.filter((segment) => segment.pct > 0);

	const cells: Cell[] = [
		{
			key: "rak",
			label: "Rak",
			dot: "bg-chart-1",
			used: stats.rakUsed,
			capacity: stats.rakCap,
			meta: `${stats.totalRak} rak`,
		},
		{
			key: "kardus",
			label: "Kardus",
			dot: "bg-chart-2",
			used: stats.kardusUsed,
			capacity: stats.kardusCap,
			meta: `${stats.totalKardus} kardus`,
		},
		{
			key: "pallet",
			label: "Pallet",
			dot: "bg-chart-3",
			used: stats.palletUsed,
			capacity: stats.palletCap,
			meta: `${stats.totalPallet} pallet`,
		},
		{
			key: "kosong",
			label: "Tersedia",
			dot: "bg-ash",
			used: freeUnits,
			capacity: stats.maxCapacity,
			meta: "Sisa Kapasitas",
		},
	];

	return (
		<section
			aria-labelledby="ringkasan-kapasitas"
			className="rounded-md border border-border bg-card"
		>
			<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 pt-4 md:px-5">
				<h2 id="ringkasan-kapasitas" className="text-sm font-medium text-foreground">
					Kapasitas gudang KP
				</h2>

				{isLoading ? (
					<span className="h-3.5 w-44 animate-pulse rounded-sm bg-muted" aria-hidden />
				) : (
					<p className="text-xs tabular-nums text-muted-foreground">
						{hasCapacity ? (
							<>
								<span className="font-medium text-foreground">
									{stats.utilizationPct}%
								</span>{" "}
								terpakai
								<span aria-hidden className="mx-1.5 text-border">
									·
								</span>
								{stats.usedCapacity.toLocaleString("id-ID")} /{" "}
								{stats.maxCapacity.toLocaleString("id-ID")} unit
							</>
						) : (
							<span></span>
						)}
					</p>
				)}
			</div>

			<div className="px-4 pt-3 pb-4 md:px-5">
				{isLoading ? (
					<div className="h-3 w-full animate-pulse rounded-sm bg-muted" aria-hidden />
				) : (
					<div
						role="img"
						aria-label={
							hasCapacity
								? `Okupansi gudang ${stats.utilizationPct}%. ${cells
										.slice(0, 3)
										.map(
											(cell) =>
												`${cell.label} ${cell.used} dari ${cell.capacity} unit`,
										)
										.join(", ")}. Tersedia ${freeUnits} unit.`
								: "Belum ada kapasitas gudang yang tercatat."
						}
						className="flex h-3 w-full overflow-hidden rounded-sm bg-muted"
					>
						{segments.map((segment) => (
							<div
								key={segment.key}
								className={cn(
									"flex h-full items-center overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none",
									segment.bar,
								)}
								style={{ width: `${segment.pct}%` }}
							>
								{segment.pct >= SEGMENT_MIN_LABEL_PCT && (
									<span
										className={cn(
											"truncate px-2 text-xs font-medium tabular-nums",
											segment.text,
										)}
									>
										{segment.key} {segment.pct}%
									</span>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			<dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
				{cells.map((cell) => {
					// "Tersedia" bukan jenis penyimpanan: persentase terhadap total gudang
					// hanya akan mengulang angka okupansi di header.
					const pct =
						cell.key !== "kosong" && cell.capacity > 0
							? Math.round((cell.used / cell.capacity) * 100)
							: null;

					const isClickable = cell.key !== "kosong" && Boolean(onSelectType);
					const isSelected = activeType === cell.key;

					return (
						<div
							key={cell.key}
							onClick={() => {
								if (isClickable) {
									onSelectType?.(cell.key as "rak" | "kardus" | "pallet");
								}
							}}
							className={cn(
								"bg-card px-4 py-3 md:px-5 transition-colors",
								isClickable && "cursor-pointer hover:bg-muted/40",
								isSelected && "bg-muted/30",
							)}
						>
							<dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<span
									aria-hidden
									className={cn("size-1.5 shrink-0 rounded-full", cell.dot)}
								/>
								{cell.label}
							</dt>
							{isLoading ? (
								<>
									<dd className="mt-1.5">
										<span className="block h-3.5 w-16 animate-pulse rounded-sm bg-muted" />
									</dd>
									<dd className="mt-1.5">
										<span className="block h-2.5 w-20 animate-pulse rounded-sm bg-muted" />
									</dd>
								</>
							) : (
								<>
									<dd className="mt-1 flex items-baseline gap-1 tabular-nums">
										<span className="text-sm font-medium text-foreground">
											{cell.used.toLocaleString("id-ID")}
										</span>
										<span className="text-[11px] text-muted-foreground">
											{cell.capacity > 0
												? `/ ${cell.capacity.toLocaleString("id-ID")} unit`
												: "unit"}
										</span>
									</dd>
									<dd className="mt-1 font-normal text-xs text-muted-foreground">
										{cell.meta}
										{pct !== null && ` · ${pct}%`}
									</dd>
								</>
							)}
						</div>
					);
				})}
			</dl>
		</section>
	);
}
