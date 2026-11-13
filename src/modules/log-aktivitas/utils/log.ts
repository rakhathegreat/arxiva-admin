import type { ActorRole, LogEntity, LogRange } from "../types";

const ACTION_LABELS: Record<string, string> = {
	"material.create": "Tambah material",
	"material.update": "Ubah material",
	"material.delete": "Hapus material",
	"material.change": "Ubah material",
	"request.create": "Buat request",
	"request.update": "Ubah request",
	"request.delete": "Hapus request",
	"request.approve": "Setujui request",
	"request.reject": "Tolak request",
	"request.cancel": "Batalkan request",
	"request.prepare": "Siapkan request",
	"request.handover": "Serah request",
	"request.complete": "Selesaikan request",
	"user.create": "Tambah pengguna",
	"user.update": "Ubah pengguna",
	"user.delete": "Hapus pengguna",
	"location.create": "Tambah lokasi",
	"location.update": "Ubah lokasi",
	"location.delete": "Hapus lokasi",
	"catalog.create": "Tambah master data",
	"catalog.update": "Ubah master data",
	"catalog.delete": "Hapus master data",
	"recon.create": "Catat rekon",
	"recon.update": "Ubah rekon",
	"auth.login": "Login",
	"notification.read": "Baca notifikasi",
	"notification.update": "Ubah notifikasi",
	"file.create": "Unggah berkas",
	"file.delete": "Hapus berkas",
	"system.change": "Perubahan sistem",
};

const ENTITY_NAMES: Record<string, string> = {
	material: "Material",
	request: "Request",
	user: "Pengguna",
	location: "Lokasi",
	catalog: "Master data",
	recon: "Rekon",
	auth: "Autentikasi",
	notification: "Notifikasi",
	file: "Berkas",
	system: "Sistem",
};

const ENTITY_TONES: Record<
	string,
	"slate" | "blue" | "violet" | "amber" | "emerald" | "cyan" | "zinc"
> = {
	material: "blue",
	request: "violet",
	user: "amber",
	location: "cyan",
	catalog: "slate",
	recon: "emerald",
	auth: "zinc",
	notification: "slate",
	file: "slate",
	system: "zinc",
};

export const ENTITY_OPTIONS: { value: LogEntity; label: string }[] = [
	{ value: "all", label: "Semua entitas" },
	{ value: "material", label: "Material" },
	{ value: "request", label: "Request" },
	{ value: "user", label: "Pengguna" },
	{ value: "location", label: "Lokasi" },
	{ value: "catalog", label: "Master data" },
	{ value: "recon", label: "Rekon" },
	{ value: "auth", label: "Autentikasi" },
	{ value: "notification", label: "Notifikasi" },
	{ value: "file", label: "Berkas" },
	{ value: "system", label: "Sistem" },
];

export const RANGE_OPTIONS: { value: LogRange; label: string }[] = [
	{ value: "today", label: "Hari ini" },
	{ value: "7d", label: "7 hari terakhir" },
	{ value: "30d", label: "30 hari terakhir" },
	{ value: "all", label: "Semua waktu" },
];

const capitalize = (value: string) =>
	value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export function entityLabel(entity: string): string {
	return ENTITY_NAMES[entity] ?? capitalize(entity);
}

export function entityTone(entity: string) {
	return ENTITY_TONES[entity] ?? "slate";
}

export function actionLabel(action: string): string {
	const known = ACTION_LABELS[action];
	if (known) return known;

	const [entity, verb = ""] = action.split(".");
	return `${entityLabel(entity)} · ${capitalize(verb.replace(/[-_]/g, " "))}`.trim();
}

export function roleLabel(role: ActorRole | null | undefined): string {
	if (role === "ADMIN") return "Admin";
	if (role === "INTERNAL") return "Internal";
	if (role === "MITRA") return "Mitra";
	return "Tidak tercatat";
}

export function statusLabel(status: "SUCCESS" | "FAILED"): string {
	return status === "SUCCESS" ? "Berhasil" : "Gagal";
}

const pad = (value: number) => String(value).padStart(2, "0");

function clock(date: Date): string {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatLogDateParts(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return { time: "--:--:--", date: "-", full: "-" };
	}

	const day = new Intl.DateTimeFormat("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);

	const time = clock(date);

	return { time, date: day, full: `${day} · ${time}` };
}

export function formatLogTime(value: string | Date | null): string {
	if (!value) return "-";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return clock(date);
}

export function actorInitials(name: string | null | undefined, username?: string | null): string {
	const source = (name || username || "").trim();
	if (!source) return "?";
	return source
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}
