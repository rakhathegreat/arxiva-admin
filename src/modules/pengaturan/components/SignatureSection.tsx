import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, Eraser, Loader2, QrCode, Smartphone } from "lucide-react";
import QRCode from "qrcode";

import { useAuth } from "@/modules/auth/auth";
import { api, getApiErrorMessage, getBaseUrl } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { SettingsSection } from "./SettingsSection";

export function SignatureSection() {
	const { user, updateUser } = useAuth();
	const [isDeleting, setIsDeleting] = useState(false);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const pollingInterval = useRef<NodeJS.Timeout | null>(null);

	const hasSignature = Boolean(user?.profile?.picSignatureUrl);
	const signatureUrl = user?.profile?.picSignatureUrl;

	useEffect(() => {
		return () => {
			if (pollingInterval.current) clearInterval(pollingInterval.current);
		};
	}, []);

	const handleDelete = async () => {
		if (!user) return;
		setIsDeleting(true);
		try {
			const res = await api.put(`/users/${user.id}`, {
				picSignatureUrl: null,
			});

			if (res.data) {
				updateUser({
					profile: {
						...user.profile,
						picSignatureUrl: null,
					},
				});
				toast.success("Tanda tangan berhasil dihapus");
			}
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Gagal menghapus tanda tangan"));
		} finally {
			setIsDeleting(false);
		}
	};

	const startQrSession = async () => {
		try {
			const res = await api.post(`/signature-session`, { userId: user?.id });
			const sessionId = res.data.id;

			const backendBaseUrl = getBaseUrl();
			const mobileUrl = `${backendBaseUrl}/signature-session/${sessionId}/mobile`;

			const url = await QRCode.toDataURL(mobileUrl, { width: 320, margin: 2 });
			setQrCodeUrl(url);
			setQrModalOpen(true);

			if (pollingInterval.current) clearInterval(pollingInterval.current);
			pollingInterval.current = setInterval(async () => {
				try {
					const pollRes = await api.get(`/signature-session/${sessionId}`);
					if (pollRes.data.status === "COMPLETED" && pollRes.data.signatureUrl) {
						if (user) {
							await api.put(`/users/${user.id}`, {
								picSignatureUrl: pollRes.data.signatureUrl,
							});
							updateUser({
								profile: {
									...user.profile,
									picSignatureUrl: pollRes.data.signatureUrl,
								},
							});
						}

						setQrModalOpen(false);
						if (pollingInterval.current) clearInterval(pollingInterval.current);
						toast.success("Tanda tangan berhasil diperbarui via ponsel");
					}
				} catch {
					// Abaikan error polling sesaat
				}
			}, 2000);
		} catch {
			toast.error("Gagal membuat sesi QR Code");
		}
	};

	const handleQrModalClose = (open: boolean) => {
		setQrModalOpen(open);
		if (!open && pollingInterval.current) {
			clearInterval(pollingInterval.current);
		}
	};

	return (
		<SettingsSection
			id="tanda-tangan"
			title="Tanda Tangan"
			description="Dipakai otomatis saat menandatangani BAST."
			footer={
				<>
					{hasSignature && (
						<Button
							size="sm"
							variant="ghost"
							className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Eraser className="size-3.5" />
							)}
							Hapus
						</Button>
					)}
					<Button
						size="sm"
						onClick={startQrSession}
						className="w-full rounded-md sm:w-auto"
					>
						<Smartphone className="size-3.5" />
						{hasSignature ? "Perbarui via ponsel" : "Buat via ponsel"}
					</Button>
				</>
			}
		>
			{hasSignature && signatureUrl ? (
				<div className="flex h-36 items-center justify-center rounded-md border border-border bg-white p-4">
					<img
						src={signatureUrl}
						alt="Tanda tangan default"
						className="max-h-28 max-w-full object-contain"
					/>
				</div>
			) : (
				<div className="flex h-36 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4">
					<p className="text-xs text-muted-foreground">Belum ada tanda tangan default.</p>
				</div>
			)}

			<Dialog open={qrModalOpen} onOpenChange={handleQrModalClose}>
				<DialogContent className="flex flex-col items-center gap-6 p-8 text-center sm:max-w-md">
					<DialogHeader className="w-full text-center">
						<DialogTitle className="text-center">Signature via mobile</DialogTitle>
						<DialogDescription className="text-center text-xs">
							Pindai QR ini dengan kamera ponsel Anda.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-md border border-border bg-white p-3">
						<img
							src={qrCodeUrl}
							alt="QR code untuk membuka kanvas tanda tangan"
							className="size-52"
						/>
					</div>

					<div className="grid w-full grid-cols-3 gap-2 pt-2">
						<div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
							<Camera className="mb-1 size-4 text-muted-foreground" />
							<span className="text-[10px] font-medium">1. Buka kamera</span>
						</div>
						<div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
							<QrCode className="mb-1 size-4 text-muted-foreground" />
							<span className="text-[10px] font-medium">2. Pindai QR</span>
						</div>
						<div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
							<CheckCircle2 className="mb-1 size-4 text-muted-foreground" />
							<span className="text-[10px] font-medium">3. Tanda tangan</span>
						</div>
					</div>

					<p className="text-[11px] leading-relaxed text-muted-foreground">
						Halaman ini tertutup dan profil diperbarui otomatis setelah Anda menekan{" "}
						<strong className="font-medium text-foreground">Kirim</strong> di ponsel.
					</p>
				</DialogContent>
			</Dialog>
		</SettingsSection>
	);
}
