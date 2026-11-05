import { Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import type { SheetMode } from "@/shared/types/ui";
import type { LokasiBarangState } from "../hooks/useLokasiBarang";
import { LokasiSheet } from "./LokasiSheet";

const SHEET_COPY: Record<SheetMode, { title: string; description: string }> = {
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

/** Sheet form tambah/edit lokasi penyimpanan. */
export function LokasiEditorSheet({ lokasi }: { lokasi: LokasiBarangState }) {
	const copy = SHEET_COPY[lokasi.sheetMode];
	const isAdd = lokasi.sheetMode.startsWith("add-");

	return (
		<Sheet
			open={lokasi.sheetMode !== "closed"}
			onOpenChange={(open) => !open && lokasi.setSheetMode("closed")}>
			<SheetContent className="flex flex-col sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="text-base font-medium">{copy.title}</SheetTitle>
					<SheetDescription className="text-xs">{copy.description}</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-4 pb-4">
					<div className="grid gap-5">
						<LokasiSheet
							mode={lokasi.sheetMode}
							brands={lokasi.brands}
							locName={lokasi.locName}
							setLocName={lokasi.setLocName}
							locCapacity={lokasi.locCapacity}
							setLocCapacity={lokasi.setLocCapacity}
							locBrand={lokasi.locBrand}
							setLocBrand={lokasi.setLocBrand}
							locLevelsCount={lokasi.locLevelsCount}
							setLocLevelsCount={lokasi.setLocLevelsCount}
						/>
					</div>
				</div>

				<SheetFooter className="flex-row justify-end gap-2 border-t border-border">
					<Button
						variant="outline"
						size="sm"
						onClick={() => lokasi.setSheetMode("closed")}
						disabled={lokasi.isSaving}
						className="cursor-pointer">
						Batal
					</Button>
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
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
