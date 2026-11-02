import { Archive, Layers, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const STORAGE_TYPES = ["Rak", "Kardus", "Pallet"] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

export interface StorageTypeConfig {
	icon: LucideIcon;
	/** Warna teks ikon & penanda tipe. */
	text: string;
	/** Latar chip ikon. */
	chipBg: string;
	/** Warna dasar progress bar untuk tipe ini. */
	bar: string;
}

/**
 * Satu sumber kebenaran identitas visual per tipe penyimpanan.
 * Dipakai oleh kartu, statistik, dropdown, dan badge agar warna konsisten.
 */
export const TYPE_CONFIG: Record<StorageType, StorageTypeConfig> = {
	Rak: {
		icon: Layers,
		text: "text-foreground",
		chipBg: "bg-foreground/5",
		bar: "bg-chart-1",
	},
	Kardus: {
		icon: Archive,
		text: "text-charcoal",
		chipBg: "bg-foreground/[0.04]",
		bar: "bg-chart-2",
	},
	Pallet: {
		icon: Package,
		text: "text-stone",
		chipBg: "bg-muted",
		bar: "bg-chart-3",
	},
};

export function getTypeConfig(type: string): StorageTypeConfig {
	return TYPE_CONFIG[type as StorageType] ?? TYPE_CONFIG.Kardus;
}
