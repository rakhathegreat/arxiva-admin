import { Loader2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { LokasiBarangState } from "../hooks/useLokasiBarang";

/** Konfirmasi hapus lokasi atau level penyimpanan. */
export function DeleteLokasiDialog({ lokasi }: { lokasi: LokasiBarangState }) {
	const { deleteAlertData, setDeleteAlertData, confirmDelete, isDeleting } = lokasi;
	const isLocation = deleteAlertData.type === "location";

	return (
		<AlertDialog
			open={deleteAlertData.isOpen}
			onOpenChange={(open) => !open && setDeleteAlertData({ ...deleteAlertData, isOpen: false })}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-base">
						Hapus {isLocation ? "lokasi" : "level"} ini?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-xs">
						<strong className="font-medium text-foreground">{deleteAlertData.name}</strong>{" "}
						beserta seluruh material dan riwayatnya akan dihapus permanen. Tindakan ini tidak
						dapat dibatalkan.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel disabled={isDeleting} className="cursor-pointer text-xs">
						Batal
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => confirmDelete(e)}
						disabled={isDeleting}
						className="cursor-pointer bg-destructive text-xs text-background hover:bg-destructive/90">
						{isDeleting ? (
							<>
								<Loader2 className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none" />
								Menghapus…
							</>
						) : (
							"Hapus permanen"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
