import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { AlertTriangle, ArrowRight, Check, Copy, Edit, History, MapPin, X } from "lucide-react";
import type { BarangUnit, RiwayatUnit } from "@/shared/types/inventory";
import { toast } from "sonner";
import { formatItemLocation } from "@/shared/lib/status-helper";
import { StatusBadge } from "@/shared/ui/status-badge";
import { RekonStatus } from "./RekonStatus";
import { getBaseUrl, getHeaders } from "@/shared/lib/api";
import { cn } from "@/shared/lib/utils";

interface BarangDetailDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	detailBarang: BarangUnit | null;
	userRole?: string;
	onOpenEdit: (item: BarangUnit) => void;
	formatTanggal: (tgl: string) => string;
	ADMIN_LOCATION: string;
}

function Section({
	title,
	meta,
	children,
}: {
	title: string;
	meta?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="border-t border-border first:border-t-0">
			<div className="px-5 py-5 sm:px-6">
				<div className="mb-3 flex items-baseline justify-between gap-2">
					<h3 className="text-sm font-medium tracking-tight text-foreground">{title}</h3>
					{meta ? <span className="meta-label tabular-nums">{meta}</span> : null}
				</div>
				{children}
			</div>
		</section>
	);
}

function Field({
	label,
	value,
	mono,
	className,
}: {
	label: string;
	value: ReactNode;
	mono?: boolean;
	className?: string;
}) {
	const isEmpty = value === null || value === undefined || value === "";

	return (
		<div className={className}>
			<dt className="meta-label">{label}</dt>
			<dd
				className={cn(
					"mt-1 text-sm break-words",
					mono && "font-mono tabular-nums break-all",
					isEmpty ? "text-muted-foreground" : "text-foreground",
				)}
			>
				{isEmpty ? "-" : value}
			</dd>
		</div>
	);
}

function HistorySkeleton() {
	return (
		<div className="space-y-5" aria-hidden="true">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="flex gap-3">
					<div className="mt-1 size-[7px] shrink-0 rounded-full bg-muted" />
					<div className="flex-1 animate-pulse space-y-2">
						<div className="flex items-center justify-between gap-4">
							<div className="h-3 w-24 rounded-sm bg-muted" />
							<div className="h-3 w-16 rounded-sm bg-muted" />
						</div>
						<div className="h-3 w-32 rounded-sm bg-muted" />
						<div className="h-3 w-full max-w-56 rounded-sm bg-muted" />
					</div>
				</div>
			))}
		</div>
	);
}

function HistoryTimeline({
	entries,
	fallbackLocation,
	formatTanggal,
}: {
	entries: RiwayatUnit[];
	fallbackLocation: string;
	formatTanggal: (tgl: string) => string;
}) {
	return (
		<ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[3.5px] before:w-px before:bg-border">
			{entries.map((trx, index) => {
				const tipeLabel = trx.tipe || trx.kategori || "Masuk";
				const nomorSurat = trx.nomorSurat || trx.nomor || "-";
				const lokasiText = trx.lokasi || trx.tujuan || trx.asal || fallbackLocation;
				const transitionTo = trx.keStatus || lokasiText;

				return (
					<li key={`${nomorSurat}-${index}`} className="relative pl-5">
						<span
							aria-hidden="true"
							className="absolute top-[5px] left-0 size-2 rounded-full bg-foreground ring-2 ring-card"
						/>
						<div className="space-y-1">
							<div className="flex items-baseline justify-between gap-3">
								<p className="text-sm font-medium text-foreground">{tipeLabel}</p>
								<time
									dateTime={trx.tanggal}
									className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
								>
									{formatTanggal(trx.tanggal)}
								</time>
							</div>

							<p className="font-mono text-[11px] break-all text-muted-foreground">
								{nomorSurat}
							</p>

							{trx.dariStatus ? (
								<p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
									<span className="text-foreground">{trx.dariStatus}</span>
									<ArrowRight className="size-3 shrink-0" aria-hidden="true" />
									<span className="sr-only">menuju</span>
									<span className="text-foreground">{transitionTo}</span>
								</p>
							) : null}

							{(!trx.dariStatus || trx.keStatus) && lokasiText ? (
								<p className="flex items-start gap-1.5 text-xs text-muted-foreground">
									<MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
									<span className="sr-only">Lokasi</span>
									<span className="break-words">{lokasiText}</span>
								</p>
							) : null}
						</div>
					</li>
				);
			})}
		</ol>
	);
}

function HistoryEmptyState() {
	return (
		<div className="flex flex-col items-center py-8 text-center md:items-start md:text-left">
			<History className="size-5 text-muted-foreground" aria-hidden="true" />
			<p className="mt-2 text-sm font-medium text-foreground">Belum ada riwayat mutasi</p>
			<p className="mt-1 text-xs text-muted-foreground">
				Unit ini belum pernah berpindah status atau lokasi.
			</p>
		</div>
	);
}

export function BarangDetailDialog({
	isOpen,
	onOpenChange,
	detailBarang,
	userRole,
	onOpenEdit,
	formatTanggal,
	ADMIN_LOCATION,
}: BarangDetailDialogProps) {
	const [history, setHistory] = useState<RiwayatUnit[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [historyError, setHistoryError] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const copyTimer = useRef<number | null>(null);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Berhasil menyalin Serial Number");
		setIsCopied(true);
		if (copyTimer.current) window.clearTimeout(copyTimer.current);
		copyTimer.current = window.setTimeout(() => setIsCopied(false), 2000);
	};

	useEffect(() => {
		return () => {
			if (copyTimer.current) window.clearTimeout(copyTimer.current);
		};
	}, []);

	const fetchHistory = useCallback(
		(signal?: AbortSignal) => {
			if (!detailBarang) return;

			setIsLoadingHistory(true);
			setHistoryError(false);

			fetch(`${getBaseUrl()}/items/${detailBarang.id}/history`, {
				method: "GET",
				headers: getHeaders(),
				signal,
			})
				.then((res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return res.json();
				})
				.then((data) => {
					if (signal?.aborted) return;
					setHistory(Array.isArray(data) ? data : []);
				})
				.catch((err) => {
					if (signal?.aborted) return;
					console.error("Gagal memuat riwayat transaksi unit:", err);
					setHistory([]);
					setHistoryError(true);
				})
				.finally(() => {
					if (signal?.aborted) return;
					setIsLoadingHistory(false);
				});
		},
		[detailBarang],
	);

	useEffect(() => {
		if (!isOpen || !detailBarang) return;

		const controller = new AbortController();
		setHistory([]);
		setHistoryError(false);
		setIsCopied(false);
		fetchHistory(controller.signal);

		return () => controller.abort();
	}, [isOpen, detailBarang, fetchHistory]);

	if (!detailBarang) return null;

	const title =
		[detailBarang.merek, detailBarang.tipe].filter(Boolean).join(" ") || "Detail Material";
	const locationLabel = formatItemLocation(detailBarang.lokasiPenyimpanan, detailBarang.mitra);
	const description = [detailBarang.kategori, locationLabel !== "-" ? locationLabel : null]
		.filter(Boolean)
		.join(" · ");
	const isDamaged = (detailBarang.kondisi || "").toLowerCase() === "rusak";

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[88vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[88vh]">
				<DialogHeader className="shrink-0 gap-3 border-b border-border px-5 py-4 text-left sm:px-6">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<DialogTitle
								title={title}
								className="truncate text-base font-medium tracking-tight text-foreground"
							>
								{title}
							</DialogTitle>
							<DialogDescription
								title={description}
								className="mt-0.5 truncate text-xs text-muted-foreground"
							>
								{description || "Detail unit material"}
							</DialogDescription>
						</div>

						<div className="flex shrink-0 items-center gap-1.5">
							{userRole === "admin" && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										onOpenChange(false);
										onOpenEdit(detailBarang);
									}}
									className="gap-1.5"
								>
									<Edit className="size-3.5" />
									<span className="hidden sm:inline">Edit Unit</span>
									<span className="sm:hidden">Edit</span>
								</Button>
							)}
							<DialogClose asChild>
								<Button
									size="icon-sm"
									variant="ghost"
									className="text-muted-foreground hover:text-foreground"
									aria-label="Tutup"
								>
									<X className="size-4" />
								</Button>
							</DialogClose>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<div className="flex min-w-0 items-start gap-1.5">
							<span className="min-w-0 font-mono text-sm break-all tabular-nums text-foreground">
								{detailBarang.serialNumber || "-"}
							</span>
							<Button
								size="icon-xs"
								variant="ghost"
								onClick={() => copyToClipboard(detailBarang.serialNumber)}
								aria-label="Salin Serial Number"
								className="-mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
							>
								{isCopied ? (
									<Check className="size-3.5 text-success" />
								) : (
									<Copy className="size-3.5" />
								)}
							</Button>
						</div>
						<StatusBadge
							status={detailBarang.status}
							variant="quiet"
							size="md"
							className="sm:ml-auto"
						/>
					</div>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="grid grid-cols-1 md:grid-cols-2">
						<div>
							<Section title="Spesifikasi">
								<dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
									<Field label="Kategori" value={detailBarang.kategori} />
									<Field label="Merek" value={detailBarang.merek} />
									<Field label="Tipe / Model" value={detailBarang.tipe} />
									<Field
										label="Kondisi"
										value={
											<StatusBadge
												status={detailBarang.kondisi || "Baru"}
												variant="quiet"
												size="md"
											/>
										}
									/>
									<Field
										label="Rekon Terakhir"
										className="sm:col-span-2"
										value={<RekonStatus item={detailBarang} variant="detail" />}
									/>
									<Field
										label="Tanggal Masuk"
										value={
											detailBarang.tanggalMasuk
												? formatTanggal(detailBarang.tanggalMasuk)
												: null
										}
									/>
									{detailBarang.tanggalKeluar ? (
										<Field
											label="Tanggal Keluar"
											value={formatTanggal(detailBarang.tanggalKeluar)}
										/>
									) : null}
									{detailBarang.ticket ? (
										<Field
											label="Asal Material"
											value={detailBarang.ticket}
											mono
										/>
									) : null}
								</dl>

								{isDamaged ? (
									<div className="mt-4 flex gap-2.5 rounded-md border border-border bg-muted/40 p-3">
										<AlertTriangle
											className="mt-0.5 size-4 shrink-0 text-muted-foreground"
											aria-hidden="true"
										/>
										<div className="min-w-0">
											<p className="meta-label">Catatan Kerusakan</p>
											<p className="mt-1 text-sm leading-relaxed break-words text-foreground">
												{detailBarang.catatan || "-"}
											</p>
										</div>
									</div>
								) : null}
							</Section>

							<Section title="Lokasi & Kepemilikan">
								<dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
									<Field
										label="Lokasi Storage"
										value={locationLabel !== "-" ? locationLabel : null}
									/>
									<Field
										label="Pemilik / Tempat"
										value={detailBarang.mitra || ADMIN_LOCATION}
									/>
								</dl>
							</Section>
						</div>

						<div className="border-t border-border md:border-t-0 md:border-l md:border-border">
							<Section title="Riwayat Mutasi">
								<div aria-busy={isLoadingHistory}>
									{isLoadingHistory ? (
										<>
											<span className="sr-only">Memuat riwayat mutasi…</span>
											<HistorySkeleton />
										</>
									) : historyError ? (
										<div className="flex flex-col items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
											<p className="text-sm text-foreground">
												Gagal memuat riwayat mutasi.
											</p>
											<Button
												size="xs"
												variant="outline"
												onClick={() => fetchHistory()}
											>
												Coba lagi
											</Button>
										</div>
									) : history.length === 0 ? (
										<HistoryEmptyState />
									) : (
										<HistoryTimeline
											entries={history}
											fallbackLocation={detailBarang.lokasiPenyimpanan}
											formatTanggal={formatTanggal}
										/>
									)}
								</div>
							</Section>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
