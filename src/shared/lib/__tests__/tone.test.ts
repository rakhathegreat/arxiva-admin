import { describe, expect, it } from "vitest";
import { toneFromLabel } from "../tone";
import { BADGE_TONES } from "@/shared/ui/badge";

describe("toneFromLabel", () => {
	it("falls back to a neutral tone for empty input", () => {
		expect(toneFromLabel(null)).toBe("zinc");
		expect(toneFromLabel(undefined)).toBe("zinc");
		expect(toneFromLabel("")).toBe("zinc");
		expect(toneFromLabel("   ")).toBe("zinc");
	});

	it("is stable for the same label", () => {
		expect(toneFromLabel("Kabel")).toBe(toneFromLabel("Kabel"));
		expect(toneFromLabel("Router")).toBe(toneFromLabel("Router"));
	});

	it("ignores case and surrounding whitespace", () => {
		expect(toneFromLabel("kabel")).toBe(toneFromLabel("Kabel"));
		expect(toneFromLabel("  Kabel ")).toBe(toneFromLabel("kabel"));
	});

	it("always returns a tone the badge primitive can resolve", () => {
		for (const label of ["Kabel", "Rak", "Baru", "PT Nusa", "x", "🎉"]) {
			expect(BADGE_TONES).toContain(toneFromLabel(label));
		}
	});

	it("keeps neighbouring categories distinguishable", () => {
		const categories = ["Kabel", "Adaptor", "Router", "OLT", "ONT", "Splitter"];
		const tones = categories.map(toneFromLabel);

		// With 12 eligible tones over 6 short labels, some repetition is
		// unavoidable; what matters is that it does not collapse.
		expect(new Set(tones).size).toBeGreaterThanOrEqual(3);
	});
});