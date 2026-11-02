import {
	AlertTriangle,
	CircleDashed,
	Navigation,
	Search,
	CheckCircle2,
	XCircle,
	Clock,
	HelpCircle,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type StatusType = string;

type StatusSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
	/** Status key, matched case-insensitively against the config (e.g. "in progress", "In Progress"). */
	status: StatusType;
	/** Override the displayed text. */
	label?: string;
	/** Override the leading icon. */
	icon?: LucideIcon;
	/** Visual size. */
	size?: StatusSize;
	className?: string;
}

/**
 * Status tones stay inside the monochrome system: value shifts for neutral
 * states, an inverted ink chip for terminal states, and Terminal Green only
 * for confirmed/positive outcomes.
 */
const TONE = {
	positive: "border-success/25 bg-success/10 text-success",
	active: "border-foreground/15 bg-foreground/[0.06] text-foreground",
	pending: "border-border bg-muted/60 text-charcoal",
	outlined: "border-border bg-card text-foreground",
	negative: "border-foreground bg-foreground text-background",
	muted: "border-border bg-muted text-stone",
} as const;

const STATUS_CONFIG: Record<
	string,
	{ label: string; icon: LucideIcon; className: string }
> = {
	// ── Primary workflow statuses ──
	pending: { label: "Pending", icon: AlertTriangle, className: TONE.pending },
	"in progress": {
		label: "In Progress",
		icon: CircleDashed,
		className: TONE.active,
	},
	submitted: {
		label: "Submitted",
		icon: Navigation,
		className: TONE.outlined,
	},
	"in review": { label: "In Review", icon: Search, className: TONE.pending },
	success: { label: "Success", icon: CheckCircle2, className: TONE.positive },
	failed: { label: "Failed", icon: XCircle, className: TONE.negative },
	expired: { label: "Expired", icon: Clock, className: TONE.muted },

	// ── Inventory aliases (keep existing usages resolving) ──
	menunggu: { label: "Menunggu", icon: AlertTriangle, className: TONE.pending },
	siap: { label: "Siap", icon: Search, className: TONE.pending },
	tersedia: { label: "Tersedia", icon: CheckCircle2, className: TONE.positive },
	selesai: { label: "Selesai", icon: CheckCircle2, className: TONE.positive },
	diterima: { label: "Diterima", icon: CheckCircle2, className: TONE.positive },
	bekas: { label: "Bekas", icon: CheckCircle2, className: TONE.positive },
	aktif: { label: "Aktif", icon: CheckCircle2, className: TONE.positive },
	terdistribusi: {
		label: "Terdistribusi",
		icon: CircleDashed,
		className: TONE.active,
	},
	digunakan: { label: "Digunakan", icon: CircleDashed, className: TONE.active },
	baru: { label: "Baru", icon: Navigation, className: TONE.outlined },
	hilang: { label: "Hilang", icon: XCircle, className: TONE.negative },
	rusak: { label: "Rusak", icon: XCircle, className: TONE.negative },
	ditolak: { label: "Ditolak", icon: XCircle, className: TONE.negative },
	dibatalkan: { label: "Dibatalkan", icon: XCircle, className: TONE.negative },
	disetujui: { label: "Disetujui", icon: CheckCircle2, className: TONE.positive },
	serah: { label: "Serah", icon: Navigation, className: TONE.outlined },
	// Kunci memakai format hasil `normalize()` (spasi) agar lookup tidak gagal
	"menunggu scan penerima": {
		label: "Menunggu Scan Penerima",
		icon: Clock,
		className: TONE.active,
	},
	tolak: { label: "Ditolak", icon: XCircle, className: TONE.negative },
	nonaktif: { label: "Nonaktif", icon: Clock, className: TONE.muted },
};

const NEUTRAL: { label: string; icon: LucideIcon; className: string } = {
	label: "Unknown",
	icon: HelpCircle,
	className: TONE.muted,
};

const SIZE_CLASS: Record<StatusSize, { wrap: string; icon: string }> = {
	sm: { wrap: "text-[10px] px-1.5 py-1 gap-1 rounded-sm", icon: "size-3" },
	md: { wrap: "text-[11px] px-2 py-1 gap-1.5 rounded-sm", icon: "size-3.5" },
	lg: { wrap: "text-xs px-2.5 py-1.5 gap-1.5 rounded-sm", icon: "size-4" },
};

const normalize = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ");

const toTitleCase = (value: string) =>
	value
		.toLowerCase()
		.split(/[\s_-]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

export function StatusBadge({
	status,
	label,
	icon,
	size = "md",
	className,
}: StatusBadgeProps) {
	const config = STATUS_CONFIG[normalize(status)] ?? {
		...NEUTRAL,
		label: toTitleCase(status),
	};
	const Icon = icon ?? config.icon;
	const text = label ?? config.label;
	const sizing = SIZE_CLASS[size];

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-sm border font-mono font-medium tracking-[0.06em] whitespace-nowrap uppercase leading-none",
				config.className,
				sizing.wrap,
				className,
			)}>
			<Icon
				className={cn(sizing.icon, "shrink-0 self-center")}
				aria-hidden="true"
			/>
			<span className="inline-flex items-center leading-none">{text}</span>
		</span>
	);
}

/**
 * Demo: renders every configured status plus override and fallback examples
 * on a neutral surface that follows the active theme.
 */
export function StatusBadgeDemo() {
	const samples: {
		status: string;
		size?: StatusSize;
		label?: string;
		icon?: LucideIcon;
	}[] = [
		{ status: "pending" },
		{ status: "in progress" },
		{ status: "submitted" },
		{ status: "in review" },
		{ status: "success" },
		{ status: "failed" },
		{ status: "expired" },
		{ status: "unknown-status" },
		{ status: "success", size: "sm", label: "Done", icon: CheckCircle2 },
		{ status: "failed", size: "lg" },
	];

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-6">
			{samples.map((sample, index) => (
				<StatusBadge key={index} {...sample} />
			))}
		</div>
	);
}
