import { Loader2, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/shared/ui/drawer";
import type { SheetMode } from "@/shared/types/ui";
import type { LokasiBarangState } from "../hooks/useLokasiBarang";
import { LokasiSheet } from "./LokasiSheet";
import { getNextShelfName } from "../utils/lokasi";

const DRAWER_COPY: Record<SheetMode, { title: string; description: string }> = {
	closed: { title: "", description: "" },
	"add-rak": {
		title: "Tambah rak",
		description: "Rak baru dibuat dengan level awal sesuai isian di bawah.",
	},
	"add-kardus": {
		title: "Tambah kardus",
		description: "Tentukan kapasitas dan aturan merek untuk kardus ini.",
	},
	"add-pallet": {
		title: "Tambah pallet",
		description: "Tentukan kapasitas dan aturan merek untuk pallet ini.",
	},
	"edit-rak": {
		title: "Edit rak",
		description: "Ubah nama rak. Level dan kapasitasnya diatur dari daftar level.",
	},
	"edit-kardus": {
		title: "Edit kardus",
		description: "Perbarui nama, kapasitas, atau aturan merek.",
	},
	"edit-pallet": {
		title: "Edit pallet",
		description: "Perbarui nama, kapasitas, atau aturan merek.",
	},
	"add-level": {
		title: "Tambah level",
		description: "Level baru diberi nama otomatis mengikuti urutan pada rak.",
	},
	"edit-level": {
		title: "Edit level",
		description: "Perbarui kapasitas atau aturan merek level ini.",
	},
};

/** Drawer form tambah/edit lokasi penyimpanan. */
export function LokasiEditorDrawer({ lokasi }: { lokasi: LokasiBarangState }) {
	const copy = DRAWER_COPY[lokasi.sheetMode];
	const isAdd = lokasi.sheetMode.startsWith("add-");
	const namePlaceholder =
		lokasi.sheetMode === "add-rak"
			? getNextShelfName(lokasi.locations)
			: lokasi.sheetMode === "add-kardus"
				? "Kardus Baru"
				: lokasi.sheetMode === "add-pallet"
					? "Pallet Baru"
					: undefined;

	return (
		<Drawer
			direction="right"
			open={lokasi.sheetMode !== "closed"}
			onOpenChange={(open) => !open && lokasi.setSheetMode("closed")}>
			<DrawerContent className="gap-0 p-0 data-[vaul-drawer-direction=right]:sm:max-w-md">
				<DrawerHeader className="shrink-0 gap-2 border-b border-border px-4 pb-4 text-left">
					<div className="flex items-start justify-between gap-3">
						<div className="flex min-w-0 flex-col gap-1">
							<DrawerTitle className="font-heading text-base font-medium">{copy.title}</DrawerTitle>
							<DrawerDescription className="text-xs">{copy.description}</DrawerDescription>
						</div>
						<DrawerClose asChild>
							<Button
								size="icon-sm"
								variant="ghost"
								aria-label="Tutup"
								className="cursor-pointer text-muted-foreground hover:text-foreground">
								<X className="size-4" />
							</Button>
						</DrawerClose>
					</div>
				</DrawerHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
					<div className="grid gap-5">
						<LokasiSheet
							mode={lokasi.sheetMode}
							brands={lokasi.brands}
							locName={lokasi.locName}
							setLocName={lokasi.setLocName}
							locNamePlaceholder={namePlaceholder}
							locCapacity={lokasi.locCapacity}
							setLocCapacity={lokasi.setLocCapacity}
							locBrand={lokasi.locBrand}
							setLocBrand={lokasi.setLocBrand}
							locLevelsCount={lokasi.locLevelsCount}
							setLocLevelsCount={lokasi.setLocLevelsCount}
						/>
					</div>
				</div>

				<DrawerFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-4 py-3">
					<DrawerClose asChild>
						<Button variant="outline" size="sm" disabled={lokasi.isSaving} className="cursor-pointer">
							Batal
						</Button>
					</DrawerClose>
					<Button
						size="sm"
						onClick={lokasi.handleSave}
						disabled={lokasi.isSaving}
						className="cursor-pointer gap-1.5">
						{lokasi.isSaving ? (
							<>
								<Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
								Menyimpan…
							</>
						) : isAdd ? (
							"Simpan"
						) : (
							"Simpan perubahan"
						)}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
