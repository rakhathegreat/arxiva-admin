import { Badge, type BadgeTone } from "@/shared/ui/badge";

export type StatusType = string;

type StatusSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
	/** Status key, matched case-insensitively against the config. */
	status: StatusType;
	/** Override the displayed text. */
	label?: string;
	size?: StatusSize;
	className?: string;
}

interface StatusStyle {
	label: string;
	tone: BadgeTone;
	/** Quiet member for states that should not pull focus. */
	quiet?: boolean;
}

/**
 * Color carries the state, the label carries the meaning. Every state
 * resolves to one hue, so "Menunggu" reads amber in a table, a drawer,
 * and a dashboard widget alike.
 */
const STATUS_CONFIG: Record<string, StatusStyle> = {
	// ── Primary workflow statuses ──
	pending: { label: "Pending", tone: "amber" },
	"in progress": { label: "In Progress", tone: "blue" },
	submitted: { label: "Submitted", tone: "indigo" },
	"in review": { label: "In Review", tone: "violet" },
	success: { label: "Success", tone: "emerald" },
	failed: { label: "Failed", tone: "rose" },
	expired: { label: "Expired", tone: "zinc", quiet: true },

	// ── Inventory aliases (keep existing usages resolving) ──
	menunggu: { label: "Menunggu", tone: "amber" },
	siap: { label: "Siap", tone: "blue" },
	tersedia: { label: "Tersedia", tone: "emerald" },
	selesai: { label: "Selesai", tone: "emerald" },
	diterima: { label: "Diterima", tone: "emerald" },
	bekas: { label: "Bekas", tone: "lime" },
	aktif: { label: "Aktif", tone: "emerald" },
	terdistribusi: { label: "Terdistribusi", tone: "sky" },
	digunakan: { label: "Digunakan", tone: "teal" },
	baru: { label: "Baru", tone: "indigo" },
	hilang: { label: "Hilang", tone: "rose" },
	rusak: { label: "Rusak", tone: "orange" },
	ditolak: { label: "Ditolak", tone: "red" },
	dibatalkan: { label: "Dibatalkan", tone: "zinc", quiet: true },
	disetujui: { label: "Disetujui", tone: "emerald" },
	serah: { label: "Serah", tone: "cyan" },
	// Kunci memakai format hasil `normalize()` (spasi) agar lookup tidak gagal
	"menunggu scan penerima": {
		label: "Menunggu Scan Penerima",
		tone: "fuchsia",
	},
	tolak: { label: "Ditolak", tone: "red" },
	nonaktif: { label: "Nonaktif", tone: "zinc", quiet: true },
};

const NEUTRAL: StatusStyle = { label: "Unknown", tone: "slate", quiet: true };

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
	size = "md",
	className,
}: StatusBadgeProps) {
	const config = STATUS_CONFIG[normalize(status)] ?? {
		...NEUTRAL,
		label: toTitleCase(status),
	};

	return (
		<Badge
			variant={config.quiet ? "quiet" : "glass"}
			size={size}
			tone={config.tone}
			className={className}>
			{label ?? config.label}
		</Badge>
	);
}

