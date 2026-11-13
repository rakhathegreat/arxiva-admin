import { describe, it, expect } from "vitest";
import type { BarangUnit, StorageLocationOption } from "@/shared/types/inventory";
import {
	validateBarangForm,
	formatTanggal,
	mapItemsToExportRows,
	buildExportFileName,
	getReconState,
	isReconTelat,
} from "../barang";
import { flattenLocations } from "../../api/barangApi";

const item = (over: Partial<BarangUnit> = {}): BarangUnit =>
	({
		id: "1",
		serialNumber: "SN001",
		kategori: "Router",
		merek: "Mikrotik",
		tipe: "",
		status: "Tersedia",
		kondisi: "Baru",
		lokasiPenyimpanan: "KP Tasikmalaya - Rak A1",
		tanggalMasuk: "2026-01-15T00:00:00Z",
		...over,
	}) as BarangUnit;

describe("validateBarangForm", () => {
	it("wajib isi SN, kategori, merek, lokasi", () => {
		const errors = validateBarangForm({
			serialNumber: "  ",
			kategori: "",
			merek: "",
			tipe: "",
			status: "Tersedia",
			kondisi: "Baru",
			lokasiPenyimpanan: " ",
		});
		expect(Object.keys(errors)).toHaveLength(4);
	});

	it("form lengkap tanpa error", () => {
		const errors = validateBarangForm({
			serialNumber: "SN1",
			kategori: "Router",
			merek: "Mikrotik",
			tipe: "hAP",
			status: "Tersedia",
			kondisi: "Baru",
			lokasiPenyimpanan: "Rak A1",
		});
		expect(Object.keys(errors)).toHaveLength(0);
	});
});

describe("formatTanggal", () => {
	it("format kosong jadi strip", () => {
		expect(formatTanggal("")).toBe("-");
	});
	it("format tanggal valid ke id-ID", () => {
		const out = formatTanggal("2026-01-15T00:00:00Z");
		expect(out).toMatch(/2026/);
	});
	it("string tak valid dikembalikan apa adanya", () => {
		expect(formatTanggal("bukan-tanggal")).toBe("bukan-tanggal");
	});
});

describe("mapItemsToExportRows", () => {
	it("memetakan kolom standar ke label excel", () => {
		const rows = mapItemsToExportRows([item()], ["serialNumber", "tipe"]);
		expect(rows[0]["Serial Number (SN)"]).toBe("SN001");
		expect(rows[0]["Model / Tipe"]).toBe("-");
	});

	it("kolom tanggal keluar kosong jadi strip", () => {
		const rows = mapItemsToExportRows([item()], ["tanggalKeluar"]);
		expect(rows[0]["Tanggal Keluar"]).toBe("-");
	});

	it("kolom tak dikenal diambil langsung dari item", () => {
		const rows = mapItemsToExportRows([item({ mitra: "PT X" } as any)], ["mitra"]);
		expect(rows[0].mitra).toBe("PT X");
	});
});

describe("buildExportFileName", () => {
	it("mengandung tanggal ISO", () => {
		expect(buildExportFileName(new Date("2026-08-25T10:00:00Z"))).toBe(
			"Data_Barang_Arxiva_2026-08-25.xlsx",
		);
	});
});

describe("getReconState", () => {
	const now = new Date("2026-02-14T09:30:00");

	it("status tanpa kewajiban rekon selalu ok", () => {
		expect(getReconState({ status: "Tersedia", lastReconDate: undefined }, now)).toBe("ok");
		expect(getReconState({ status: "Rusak", lastReconDate: "2026-01-01" }, now)).toBe("ok");
	});

	it("belum pernah rekon", () => {
		expect(getReconState({ status: "Terdistribusi" }, now)).toBe("belum");
		expect(getReconState({ status: "Digunakan", lastReconDate: "" }, now)).toBe("belum");
		expect(getReconState({ status: "Digunakan", lastReconDate: "bukan-tanggal" }, now)).toBe(
			"belum",
		);
	});

	it("rekon hari ini dianggap ok, bukan telat", () => {
		expect(getReconState({ status: "Terdistribusi", lastReconDate: "2026-02-14" }, now)).toBe(
			"ok",
		);
		expect(getReconState({ status: "Digunakan", lastReconDate: "2026-02-14T23:59:00" }, now)).toBe(
			"ok",
		);
	});

	it("rekon sebelum hari ini dianggap telat", () => {
		expect(getReconState({ status: "Terdistribusi", lastReconDate: "2026-02-13" }, now)).toBe(
			"telat",
		);
		expect(getReconState({ status: "Digunakan", lastReconDate: "2025-12-31" }, now)).toBe("telat");
	});

	it("isReconTelat sepakat dengan getReconState", () => {
		expect(isReconTelat({ status: "Terdistribusi", lastReconDate: undefined })).toBe(true);
		expect(isReconTelat({ status: "Tersedia", lastReconDate: undefined })).toBe(false);
	});
});

describe("flattenLocations", () => {
	it("hanya menampilkan lokasi KP, termasuk pecahan Rak", () => {
		const locs = flattenLocations([
			{ name: "KP Tasikmalaya", type: "Gudang", owner: "KP Tasikmalaya" },
			{
				name: "Rak B",
				type: "Rak",
				owner: "kp tasikmalaya",
				levels: [{ name: "L1" }, { name: "L2" }],
			},
			{ name: "PT Mitra Jaya", type: "Partner", owner: "PT Mitra Jaya" },
			{ name: "PT. Lain", type: "Gudang", owner: "PT. Lain" },
		]);
		const names = locs.map((l: StorageLocationOption) => l.name);
		expect(names).toContain("KP Tasikmalaya");
		expect(names).toContain("Rak B - L1");
		expect(names).toContain("Rak B - L2");
		expect(names).toHaveLength(3);
	});
});
