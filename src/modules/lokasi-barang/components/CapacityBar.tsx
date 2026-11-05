import { cn } from "@/shared/lib/utils";
import { getProgressStyles } from "../utils/lokasi";

interface CapacityBarProps {
	used: number;
	capacity: number;
	/** Warna dasar bar, dari TYPE_CONFIG; default tinta. */
	baseBarClass?: string;
	className?: string;
}

/**
 * Bar kapasitas tipis dengan angka "terpakai/total" di kanannya.
 * Warna berubah di >70% (charcoal) dan >=100% (ink) via getProgressStyles.
 */
export function CapacityBar({
	used,
	capacity,
	baseBarClass = "bg-chart-1",
	className,
}: CapacityBarProps) {
	const { pct, barClass } = getProgressStyles(used, capacity, baseBarClass);

	return (
		<div className={cn("flex items-center gap-2.5", className)}>
			<div
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`${used} dari ${capacity} unit terpakai`}
				className="h-1 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
				<div
					className={cn(
						"h-full rounded-sm transition-[width] duration-300 ease-out motion-reduce:transition-none",
						pct > 0 ? barClass : "bg-transparent",
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
				<span className={cn("font-medium", pct >= 100 ? "text-foreground" : "text-foreground/75")}>
					{used.toLocaleString("id-ID")}
				</span>
				<span className="mx-0.5">/</span>
				{capacity.toLocaleString("id-ID")}
			</span>
		</div>
	);
}
