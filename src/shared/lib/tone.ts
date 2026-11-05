import type { BadgeTone } from "@/shared/ui/badge";

/**
 * Stable hue for free-form labels (kategori, merek, tipe penyimpanan).
 * The same text always lands on the same tone, so a category reads the
 * same hue in a filter, a table cell, and a detail drawer — and two
 * neighbouring categories rarely share one.
 *
 * Only tones whose shade clears 4.5:1 on the glass wash in both themes
 * are eligible, so a hashed hue can never fail contrast.
 */
const LABEL_TONES: BadgeTone[] = [
	"indigo",
	"sky",
	"teal",
	"violet",
	"amber",
	"rose",
	"cyan",
	"orange",
	"fuchsia",
	"lime",
	"blue",
	"pink",
];

export function toneFromLabel(label: string | null | undefined): BadgeTone {
	const key = label?.trim().toLowerCase();
	if (!key) return "zinc";

	// FNV-1a plus a Murmur-style finalizer: without the avalanche step,
	// short labels (the common case for categories) cluster onto the same
	// few tones. Keep everything unsigned so indices never go negative.
	let hash = 0x811c9dc5;
	for (let i = 0; i < key.length; i++) {
		hash = Math.imul(hash ^ key.charCodeAt(i), 0x01000193);
	}
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash = (hash ^ (hash >>> 16)) >>> 0;

	return LABEL_TONES[hash % LABEL_TONES.length] ?? "zinc";
}