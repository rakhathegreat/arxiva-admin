import type { BadgeTone } from "@/shared/ui/badge";

export const ROLE_META = {
	ADMIN: { label: "Admin", tone: "indigo" },
	INTERNAL: { label: "Internal", tone: "sky" },
	MITRA: { label: "Mitra", tone: "zinc" },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>;

export type BackendRole = keyof typeof ROLE_META;

/** Normalisasi role dari berbagai bentuk input (enum backend / teks bebas). */
export function toBackendRole(role: string): BackendRole {
	const r = role.trim().toUpperCase();
	if (r === "ADMIN") return "ADMIN";
	if (r === "INTERNAL") return "INTERNAL";
	return "MITRA";
}
