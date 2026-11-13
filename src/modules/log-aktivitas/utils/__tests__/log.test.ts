import { describe, expect, it } from "vitest";
import {
	actionLabel,
	actorInitials,
	entityLabel,
	formatLogDateParts,
	formatLogTime,
	roleLabel,
} from "../log";

describe("actionLabel", () => {
	it("memakai label Indonesia yang dikenal", () => {
		expect(actionLabel("material.update")).toBe("Ubah material");
		expect(actionLabel("request.approve")).toBe("Setujui request");
		expect(actionLabel("auth.login")).toBe("Login");
	});

	it("fallback humanize untuk aksi baru", () => {
		expect(actionLabel("material.receive")).toBe("Material · Receive");
	});
});

describe("entityLabel", () => {
	it("memetakan entitas dikenal", () => {
		expect(entityLabel("material")).toBe("Material");
		expect(entityLabel("catalog")).toBe("Master data");
	});

	it("mengkapitalisasi entitas tak dikenal", () => {
		expect(entityLabel("custom")).toBe("Custom");
	});
});

describe("roleLabel", () => {
	it("memetakan role dan nilai kosong", () => {
		expect(roleLabel("ADMIN")).toBe("Admin");
		expect(roleLabel("INTERNAL")).toBe("Internal");
		expect(roleLabel("MITRA")).toBe("Mitra");
		expect(roleLabel(null)).toBe("Tidak tercatat");
	});
});

describe("actorInitials", () => {
	it("mengambil maksimal dua inisial", () => {
		expect(actorInitials("Budi Santoso", "budi")).toBe("BS");
		expect(actorInitials("Budi", "budi")).toBe("B");
		expect(actorInitials(null, "budi")).toBe("B");
		expect(actorInitials(null, null)).toBe("?");
	});
});

describe("format waktu", () => {
	it("memakai jam 24 dengan titik dua", () => {
		const parts = formatLogDateParts("2026-11-12T10:42:03.000Z");
		expect(parts.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		expect(parts.date).toContain("2026");
		expect(parts.full).toContain(parts.time);
	});

	it("menangani nilai kosong/tidak valid", () => {
		expect(formatLogTime(null)).toBe("-");
		expect(formatLogTime("bukan-tanggal")).toBe("-");
		expect(formatLogDateParts("bukan-tanggal").time).toBe("--:--:--");
	});
});
