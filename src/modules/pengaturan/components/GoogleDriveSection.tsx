import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage, getBaseUrl, getHeaders } from "@/shared/lib/api";
import { openExternal } from "@/shared/lib/open-external";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { SettingRow, SettingsSection } from "./SettingsSection";

interface GoogleStatus {
	googleConnected?: boolean;
	googleEmail?: string;
	rootFolderId?: string;
}

/** Section Pengaturan > Google Drive (admin): sambungkan akun & atur folder target. */
export function GoogleDriveSection() {
	const [isConnected, setIsConnected] = useState(false);
	const [googleEmail, setGoogleEmail] = useState("");
	const [rootFolderId, setRootFolderId] = useState("");
	const [folderIdInput, setFolderIdInput] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isPolling, setIsPolling] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);
	const [isSavingFolder, setIsSavingFolder] = useState(false);
	const pollRef = useRef(false);

	const fetchStatus = useCallback(async (): Promise<GoogleStatus> => {
		const res = await fetch(`${getBaseUrl()}/auth/google/status`, {
			headers: getHeaders(),
		});
		if (!res.ok) throw new Error();
		return res.json();
	}, []);

	const applyStatus = useCallback((data: GoogleStatus) => {
		setIsConnected(Boolean(data.googleConnected));
		setGoogleEmail(data.googleEmail || "");
		setRootFolderId(data.rootFolderId || "");
		setFolderIdInput(data.rootFolderId || "");
	}, []);

	const checkStatus = useCallback(async () => {
		setIsLoading(true);
		try {
			applyStatus(await fetchStatus());
		} catch {
			toast.error("Gagal memeriksa status koneksi Google.");
		} finally {
			setIsLoading(false);
		}
	}, [applyStatus, fetchStatus]);

	useEffect(() => {
		let active = true;
		fetchStatus()
			.then((data) => {
				if (active) applyStatus(data);
			})
			.catch(() => {
				if (active) toast.error("Gagal memeriksa status koneksi Google.");
			})
			.finally(() => {
				if (active) setIsLoading(false);
			});

		return () => {
			active = false;
			pollRef.current = false;
		};
	}, [applyStatus, fetchStatus]);

	const pollStatusUntilConnected = useCallback(async () => {
		pollRef.current = true;
		const deadline = Date.now() + 5 * 60 * 1000;
		while (Date.now() < deadline && pollRef.current) {
			await new Promise((r) => setTimeout(r, 2000));
			try {
				const data = await fetchStatus();
				if (data.googleConnected) {
					applyStatus(data);
					toast.success("Akun Google berhasil terhubung", {
						description: data.googleEmail || undefined,
					});
					return true;
				}
			} catch {
				// Jaringan sesaat terputus — lanjutkan polling
			}
		}
		pollRef.current = false;
		return false;
	}, [applyStatus, fetchStatus]);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google`, {
				headers: getHeaders(),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.message || "Gagal membuat link otorisasi.");

			openExternal(data.url);

			setIsConnecting(false);
			setIsPolling(true);
			const connected = await pollStatusUntilConnected();
			setIsPolling(false);
			if (!connected) toast.error("Koneksi tidak selesai dalam batas waktu. Coba lagi.");
			return;
		} catch (err) {
			toast.error(getApiErrorMessage(err, "Gagal memulai koneksi Google."));
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		setIsDisconnecting(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/disconnect`, {
				method: "DELETE",
				headers: getHeaders(),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || "Gagal memutus koneksi.");
			}
			setIsConnected(false);
			setGoogleEmail("");
			toast.success("Akun Google berhasil diputus");
		} catch (err) {
			toast.error(getApiErrorMessage(err, "Gagal memutus koneksi."));
		} finally {
			setIsDisconnecting(false);
		}
	};

	const handleSaveFolderId = async () => {
		if (!folderIdInput.trim()) {
			toast.error("Folder ID tidak boleh kosong.");
			return;
		}
		setIsSavingFolder(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/folder-id`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify({ folderId: folderIdInput.trim() }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.message || "Gagal menyimpan Folder ID.");
			setRootFolderId(data.rootFolderId || folderIdInput.trim());
			const sync = data.sync;
			if (sync) {
				let msg = "Folder ID berhasil disimpan";
				const parts: string[] = [];
				if (sync.created) parts.push(`${sync.created} dibuat`);
				if (sync.updated) parts.push(`${sync.updated} diupdate`);
				if (parts.length) msg += ` · ${parts.join(", ")} spreadsheet lokasi`;
				if (Array.isArray(sync.failed) && sync.failed.length)
					msg += ` · ${sync.failed.length} gagal`;
				toast.success(msg);
			} else {
				toast.success("Folder ID berhasil disimpan");
			}
		} catch (err) {
			toast.error(getApiErrorMessage(err, "Gagal menyimpan Folder ID."));
		} finally {
			setIsSavingFolder(false);
		}
	};

	const folderIdChanged = folderIdInput.trim() !== rootFolderId;

	return (
		<SettingsSection
			id="google-drive"
			title="Google Drive"
			description="Spreadsheet lokasi dan QR code."
			footer={
				<Button
					size="sm"
					onClick={handleSaveFolderId}
					disabled={!isConnected || isSavingFolder || !folderIdChanged}
					className="w-full rounded-md sm:w-auto"
				>
					{isSavingFolder && <Loader2 className="size-3.5 animate-spin" />}
					Simpan
				</Button>
			}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 flex-col gap-0.5">
					{isLoading ? (
						<p className="text-xs text-muted-foreground">Memeriksa status...</p>
					) : (
						<>
							<div className="flex items-center gap-2">
								<span
									aria-hidden
									className={cn(
										"size-1.5 rounded-full",
										isConnected ? "bg-success" : "bg-muted-foreground/40",
									)}
								/>
								<p className="text-sm font-medium text-foreground">
									{isConnected ? "Terhubung" : "Belum terhubung"}
								</p>
							</div>
							{isConnected && googleEmail && (
								<p className="truncate text-xs text-muted-foreground">
									{googleEmail}
								</p>
							)}
							{isPolling && (
								<p className="text-xs text-muted-foreground">
									Menunggu persetujuan di browser...
								</p>
							)}
						</>
					)}
				</div>

				<div className="flex shrink-0 flex-wrap items-center gap-2">
					<Button
						size="sm"
						variant="ghost"
						onClick={checkStatus}
						disabled={isLoading || isPolling}
						className="w-full rounded-md sm:w-auto"
					>
						Periksa
					</Button>
					{!isLoading && !isConnected && !isPolling && (
						<Button
							size="sm"
							onClick={handleConnect}
							disabled={isConnecting}
							className="w-full rounded-md sm:w-auto"
						>
							{isConnecting && <Loader2 />}
							{isConnecting ? "Membuka..." : "Sambungkan"}
						</Button>
					)}
					{isConnected && (
						<Button
							size="sm"
							variant="outline"
							className="text-destructive hover:text-destructive"
							onClick={handleDisconnect}
							disabled={isDisconnecting}
						>
							{isDisconnecting ? "Memutus..." : "Putuskan"}
						</Button>
					)}
				</div>
			</div>

			<Separator />

			<SettingRow
				id="drive-folder-id"
				label="Folder ID"
				hint={
					rootFolderId ? (
						<>
							Aktif:{" "}
							<a
								href={`https://drive.google.com/drive/folders/${rootFolderId}`}
								target="_blank"
								rel="noreferrer"
								className="font-mono underline underline-offset-2 hover:text-foreground"
							>
								{rootFolderId}
							</a>
						</>
					) : (
						"Tempel ID folder dari URL Google Drive."
					)
				}
			>
				<Input
					id="drive-folder-id"
					value={folderIdInput}
					onChange={(e) => setFolderIdInput(e.target.value)}
					placeholder="1JVje8BVIRAhQZVTjmbBAo5dMg1gVh6Xs"
					disabled={!isConnected || isSavingFolder}
					className="font-mono text-xs"
				/>
			</SettingRow>

			<p className="text-[11px] leading-relaxed text-muted-foreground">
				Hanya akun Google yang terhubung dipakai sistem. Melepas koneksi tidak menghapus
				spreadsheet yang sudah ada.
			</p>
		</SettingsSection>
	);
}
