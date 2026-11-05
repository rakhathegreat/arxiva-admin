import { Archive, Layers, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SheetMode } from "@/shared/types/ui";

export const STORAGE_TYPES = ["Rak", "Kardus", "Pallet"] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

export interface StorageTypeConfig {
	icon: LucideIcon;
	/** Mode sheet untuk mengedit tipe ini. */
	editMode: SheetMode;
	/** Mode sheet untuk menambah tipe ini. */
	addMode: SheetMode;
}

/**
 * Satu sumber kebenaran identitas per tipe penyimpanan.
 * Ikon membedakan tipe; warna tetap netral agar daftar tidak bising.
 */
export const TYPE_CONFIG: Record<StorageType, StorageTypeConfig> = {
	Rak: { icon: Layers, editMode: "edit-rak", addMode: "add-rak" },
	Kardus: { icon: Archive, editMode: "edit-kardus", addMode: "add-kardus" },
	Pallet: { icon: Package, editMode: "edit-pallet", addMode: "add-pallet" },
};

export function getTypeConfig(type: string): StorageTypeConfig {
	return TYPE_CONFIG[type as StorageType] ?? TYPE_CONFIG.Kardus;
}
