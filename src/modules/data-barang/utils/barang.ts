import type { BarangUnit, StatusUnit } from "@/shared/types/inventory";

export const STATUS_OPTIONS: Array<StatusUnit | "Digunakan"> = [
	"Tersedia",
	"Terdistribusi",
	"Digunakan",
	"Rusak",
	"Hilang",
];

export interface BarangFormData {
	serialNumber: string;
	kategori: string;
	merek: string;
	tipe: string;
	status: StatusUnit;
	kondisi: string;
	lokasiPenyimpanan: string;
	ticket?: string;
	catatan?: string;
}

/**
 * Validasi form unit barang. PURE.
 */
export function validateBarangForm(
	form: BarangFormData,
): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!form.serialNumber.trim())
		errors.serialNumber = "Serial number wajib diisi";
	if (!form.kategori.trim()) errors.kategori = "Kategori wajib diisi";
	if (!form.merek.trim()) errors.merek = "Merek barang wajib diisi";
	if (!form.lokasiPenyimpanan.trim())
		errors.lokasiPenyimpanan = "Lokasi penyimpanan wajib diisi";
	return errors;
}

export function formatTanggal(tgl: string): string {
	if (!tgl) return "-";
	const date = new Date(tgl);
	if (isNaN(date.getTime())) return tgl;
	return date.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

/**
 * Status distribusi yang menerapkan rekon harian dari mitra.
 */
export const RECON_STATUSES: StatusUnit[] = ["Terdistribusi", "Digunakan"];

/**
 * Keadaan rekon harian sebuah unit.
 * - `ok`    : sudah direkon hari ini, atau statusnya tidak butuh rekon
 * - `telat` : ada tanggal rekon tapi sebelum hari ini
 * - `belum` : belum pernah rekon sama sekali (termasuk tanggal tak terbaca)
 */
export type ReconState = "ok" | "telat" | "belum";

/**
 * Tentukan keadaan rekon dari status + tanggal rekon terakhir. PURE.
 */
export function getReconState(
	item: Pick<BarangUnit, "status" | "lastReconDate">,
	now: Date = new Date(),
): ReconState {
	if (!RECON_STATUSES.includes(item.status)) return "ok";
	if (!item.lastReconDate) return "belum";

	const last = new Date(item.lastReconDate);
	if (Number.isNaN(last.getTime())) return "belum";

	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	last.setHours(0, 0, 0, 0);

	return last.getTime() < today.getTime() ? "telat" : "ok";
}

/**
 * True jika unit butuh rekon dan belum dilakukan hari ini. PURE.
 */
export function isReconTelat(item: Pick<BarangUnit, "status" | "lastReconDate">): boolean {
	return getReconState(item) !== "ok";
}

const EXPORT_COLUMN_LABELS: Record<string, (item: BarangUnit) => any> = {
	serialNumber: (item) => ["Serial Number (SN)", item.serialNumber],
	kategori: (item) => ["Kategori Material", item.kategori],
	merek: (item) => ["Merek", item.merek],
	tipe: (item) => ["Model / Tipe", item.tipe || "-"],
	status: (item) => ["Status Barang", item.status],
	lokasiPenyimpanan: (item) => ["Lokasi Penyimpanan", item.lokasiPenyimpanan],
	tanggalMasuk: (item) => ["Tanggal Masuk", formatTanggal(item.tanggalMasuk)],
	tanggalKeluar: (item) => [
		"Tanggal Keluar",
		item.tanggalKeluar ? formatTanggal(item.tanggalKeluar) : "-",
	],
	lastReconDate: (item) => [
		"Rekon Terakhir",
		item.lastReconDate ? formatTanggal(item.lastReconDate) : "-",
	],
};

/**
 * Petakan daftar unit ke baris excel sesuai kolom terpilih. PURE.
 */
export function mapItemsToExportRows(
	items: BarangUnit[],
	selectedColumns: string[],
): Record<string, any>[] {
	return items.map((item) => {
		const row: Record<string, any> = {};
		selectedColumns.forEach((colKey) => {
			const mapper = EXPORT_COLUMN_LABELS[colKey];
			if (mapper) {
				const [label, value] = mapper(item);
				row[label] = value;
			} else {
				row[colKey] = (item as any)[colKey];
			}
		});
		return row;
	});
}

export function buildExportFileName(now = new Date()): string {
	return `Data_Barang_Arxiva_${now.toISOString().split("T")[0]}.xlsx`;
}
