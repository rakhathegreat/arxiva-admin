import { Camera } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { BarangUnit } from "@/shared/types/inventory";
import { formatTanggal, getReconState, type ReconState } from "../utils/barang";

/**
 * Rekon is a daily obligation for distributed units, so the column answers one
 * question at a glance: does this row need attention today? Colour lives in a
 * single dot, the date stays quiet metadata, and the failure mode
 * ("belum pernah rekon") is never confused with a plain empty cell.
 */
const DOT_CLASS: Record<ReconState, string> = {
	ok: "bg-transparent",
	// 700/400 keep the two states at matched perceptual weight (~4.5:1 and ~4.8:1
	// against the page background); 600 leaves amber visibly weaker than rose.
	telat: "bg-amber-700 dark:bg-amber-400",
	belum: "bg-rose-600 dark:bg-rose-400",
};

const STATE_LABEL: Record<ReconState, string> = {
	ok: "Sudah rekon hari ini",
	telat: "Belum rekon hari ini",
	belum: "Belum pernah rekon",
};

type RekonStatusProps = {
	item: Pick<BarangUnit, "status" | "lastReconDate" | "lastPhotoUrl">;
	/** `cell` is the compact table row; `detail` is the drawer block. */
	variant?: "cell" | "detail";
	className?: string;
};

export function RekonStatus({ item, variant = "cell", className }: RekonStatusProps) {
	const state = getReconState(item);
	const dateLabel = item.lastReconDate ? formatTanggal(item.lastReconDate) : "-";
	const photoUrl = item.lastPhotoUrl || null;
	const isDetail = variant === "detail";

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{/* The slot is reserved even when empty so every date shares one left edge. */}
			<span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[state])} />
			<span
				title={STATE_LABEL[state]}
				className={cn(
					"tabular-nums",
					isDetail ? "text-sm font-medium" : "font-mono text-[11px]",
					state === "ok" ? "text-muted-foreground" : "text-foreground",
					!item.lastReconDate && "text-muted-foreground",
				)}
			>
				{dateLabel}
			</span>
			<span className="sr-only">{STATE_LABEL[state]}</span>

			{isDetail ? (
				photoUrl ? (
					<a
						href={photoUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4 hover:text-primary/80"
					>
						<Camera className="size-3" aria-hidden="true" />
						Lihat foto rekon
					</a>
				) : null
			) : photoUrl ? (
				<a
					href={photoUrl}
					target="_blank"
					rel="noopener noreferrer"
					title="Lihat foto rekon"
					aria-label="Lihat foto rekon"
					className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none"
				>
					<Camera className="size-3.5" aria-hidden="true" />
				</a>
			) : (
				// Reserved, invisible slot so the camera never shifts between rows.
				<span aria-hidden="true" className="ml-auto size-6 shrink-0" />
			)}
		</div>
	);
}
