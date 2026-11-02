export const ROLE_META = {
	ADMIN: { label: "Admin", badge: "border-border bg-foreground/5 text-foreground" },
	INTERNAL: { label: "Internal", badge: "border-border bg-muted text-charcoal" },
	MITRA: { label: "Mitra", badge: "border-success/25 bg-success/10 text-success" },
} as const;

export type BackendRole = keyof typeof ROLE_META;

/** Normalisasi role dari berbagai bentuk input (enum backend / teks bebas). */
export function toBackendRole(role: string): BackendRole {
	const r = role.trim().toUpperCase();
	if (r === "ADMIN") return "ADMIN";
	if (r === "INTERNAL") return "INTERNAL";
	return "MITRA";
}
