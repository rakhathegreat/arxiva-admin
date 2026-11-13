import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, FileText, Loader2, PackageOpen, X } from "lucide-react";
import { api } from "@/shared/lib/api";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { DashboardRequest } from "@/modules/transaksi/types";
import { RejectRequestModal } from "./RejectRequestModal";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
};

const formatDate = (value?: string) =>
	value ? new Date(value).toLocaleString("id-ID", DATE_FORMAT) : "-";

const normalizeKey = (value?: string | null) =>
	(value || "").trim().toUpperCase().replace(/-/g, "_");

const isRusakType = (type?: string | null) => normalizeKey(type) === "RETURN_RUSAK";

const ALLOCATED_STATUSES = ["SIAP", "SELESAI", "DITERIMA"];
const REJECTED_STATUSES = ["DITOLAK", "DIBATALKAN"];

const getUnitByCategory = (categoryName?: string) => {
	if (!categoryName) return "Unit";
	const name = categoryName.toLowerCase();
	if (name.includes("kabel") || name.includes("foc") || name.includes("dropwire")) {
		return "Meter";
	}
	return "Unit";
};

const getCleanCategoryName = (categoryName?: string) => {
	if (!categoryName) return "-";
	const name = categoryName.toLowerCase();
	if (name.includes("ont")) return "ONT";
	if (name.includes("dropwire") || name.includes("kabel") || name.includes("foc"))
		return "DropWire";
	return categoryName;
};

/** Normalisasi respons `GET /requests/:id` ke bentuk yang dipakai drawer. */
function mapDetail(data: any): DashboardRequest {
	return {
		id: data.id,
		requestNumber: data.requestNumber,
		requesterName: data.requester?.profile?.nama || data.requester?.username,
		partnerCategory: data.requester?.profile?.partnerType || "Mitra",
		status: data.status,
		type: data.type,
		notes: data.notes || "-",
		rejectionNotes: data.rejectionNotes || undefined,
		adminRemarks: data.adminRemarks || undefined,
		requestedAt: data.requestedAt,
		itemsCount: data.requestItems?.reduce((acc: number, ri: any) => acc + ri.quantity, 0),
		allocatedCount: data.requestItems?.reduce(
			(acc: number, ri: any) => acc + (ri.allocations?.length || 0),
			0,
		),
		requestItems: data.requestItems?.map((ri: any) => ({
			id: ri.id,
			category: ri.materialCategory?.nama,
			brand: ri.brand?.nama,
			model: ri.model?.nama || ri.model?.name || "-",
			quantity: ri.quantity,
			serialNumber: ri.serialNumber || null,
			unit: getUnitByCategory(ri.materialCategory?.nama),
		})),
		requestAllocations: data.requestItems?.flatMap(
			(ri: any) =>
				ri.allocations?.map((alloc: any) => ({
					id: alloc.id,
					materialNumber: alloc.item?.model?.code || "-",
					materialCategory: ri.materialCategory?.nama,
					brand: alloc.item?.brand?.nama || ri.brand?.nama,
					materialName:
						alloc.item?.model?.deskripsi ||
						alloc.item?.model?.nama ||
						ri.model?.nama ||
						"-",
					serialNumber: alloc.item?.serialNumber,
					quantity: 1,
					unit: getUnitByCategory(ri.materialCategory?.nama),
				})) || [],
		),
		deliveryDocument: data.deliveryDocument
			? {
					kpSignedById: data.deliveryDocument.kpSignedById,
					picSignedById: data.deliveryDocument.picSignedById,
					driveViewUrl: data.deliveryDocument.driveViewUrl || null,
				}
			: null,
	};
}

function MetaField({
	label,
	value,
	mono,
}: {
	label: string;
	value?: React.ReactNode;
	mono?: boolean;
}) {
	const isEmpty = value === null || value === undefined || value === "";
	return (
		<div className="min-w-0">
			<dt className="meta-label">{label}</dt>
			<dd
				className={cn(
					"mt-1 truncate text-sm",
					mono && "font-mono text-xs tabular-nums",
					isEmpty ? "text-muted-foreground" : "text-foreground",
				)}
				title={typeof value === "string" ? value : undefined}
			>
				{isEmpty ? "-" : value}
			</dd>
		</div>
	);
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<h3 className="text-sm font-medium tracking-tight text-foreground">{title}</h3>
			{meta ? <span className="meta-label tabular-nums">{meta}</span> : null}
		</div>
	);
}

function NoteBlock({
	label,
	value,
	destructive,
}: {
	label: string;
	value: string;
	destructive?: boolean;
}) {
	return (
		<div className="rounded-md border border-border bg-muted/40 p-3">
			<p className={cn("meta-label", destructive && "text-destructive")}>{label}</p>
			<p className="mt-1 text-sm leading-relaxed break-words text-foreground">{value}</p>
		</div>
	);
}

function EmptyTableState({
	colSpan,
	title,
	description,
}: {
	colSpan: number;
	title: string;
	description?: string;
}) {
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell colSpan={colSpan} className="p-0">
				<div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
					<PackageOpen className="size-5 text-muted-foreground" aria-hidden="true" />
					<p className="text-sm font-medium text-foreground">{title}</p>
					{description ? (
						<p className="max-w-sm text-xs text-muted-foreground">{description}</p>
					) : null}
				</div>
			</TableCell>
		</TableRow>
	);
}

type MobileItem = {
	id: string;
	title: string;
	subtitle?: string;
	code?: string;
	quantity: number;
	unit?: string;
	serialNumber?: string | null;
	showSerial?: boolean;
};

/** Ringkasan item untuk layar sempit; tabel berkolom banyak tidak terbaca di ponsel. */
function MobileItemList({
	items,
	emptyTitle,
	emptyDescription,
}: {
	items: MobileItem[];
	emptyTitle: string;
	emptyDescription?: string;
}) {
	if (items.length === 0) {
		return (
			<div className="rounded-md border border-border">
				<div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
					<PackageOpen className="size-5 text-muted-foreground" aria-hidden="true" />
					<p className="text-sm font-medium text-foreground">{emptyTitle}</p>
					{emptyDescription ? (
						<p className="max-w-sm text-xs text-muted-foreground">{emptyDescription}</p>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<ul className="divide-y divide-border rounded-md border border-border">
			{items.map((item) => (
				<li key={item.id} className="flex flex-col gap-2 p-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground">
								{item.title}
							</p>
							{item.subtitle ? (
								<p className="mt-0.5 truncate text-xs text-muted-foreground">
									{item.subtitle}
								</p>
							) : null}
							{item.code ? (
								<p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
									{item.code}
								</p>
							) : null}
						</div>
						<p className="shrink-0 font-mono text-xs tabular-nums text-foreground">
							{item.quantity}
							<span className="ml-1 text-muted-foreground">
								{item.unit || "Unit"}
							</span>
						</p>
					</div>
					{item.showSerial ? (
						<dl className="grid grid-cols-[auto_1fr] gap-x-3 text-xs">
							<dt className="meta-label">SN</dt>
							<dd
								className="truncate font-mono text-muted-foreground"
								title={item.serialNumber || undefined}
							>
								{item.serialNumber || "-"}
							</dd>
						</dl>
					) : null}
				</li>
			))}
		</ul>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-5" aria-busy="true">
			<span className="sr-only">Memuat detail permintaan…</span>
			<div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="space-y-2">
						<Skeleton className="h-2.5 w-14" />
						<Skeleton className="h-4 w-24" />
					</div>
				))}
			</div>
			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-3 w-16" />
				</div>
				<div className="overflow-hidden rounded-md border border-border">
					<div className="border-b border-border bg-muted/40 px-3 py-2.5">
						<Skeleton className="h-3 w-full max-w-64" />
					</div>
					{Array.from({ length: 5 }).map((_, index) => (
						<div
							key={index}
							className="flex items-center gap-4 border-b border-border/60 px-3 py-2.5 last:border-b-0"
						>
							<Skeleton className="h-3 w-5" />
							<Skeleton className="h-3 flex-1" />
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-3 w-10" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function DetailError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-8 text-center">
			<AlertTriangle className="size-5 text-muted-foreground" aria-hidden="true" />
			<div>
				<p className="text-sm font-medium text-foreground">
					Gagal memuat detail permintaan
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Periksa koneksi Anda, lalu coba lagi.
				</p>
			</div>
			<Button size="sm" variant="outline" onClick={onRetry}>
				Coba lagi
			</Button>
		</div>
	);
}

/**
 * Drawer detail permintaan. Menampilkan ringkasan, material yang diminta atau
 * sudah dialokasikan, catatan, dan aksi status sesuai tahap permintaan.
 */
export function RequestDetailDrawer({
	item,
	open,
	onClose,
	onStatusChange,
}: {
	item: DashboardRequest | null;
	open: boolean;
	onClose: () => void;
	onStatusChange?: (
		id: string,
		newStatus: string,
		rejectionNotes?: string,
	) => void | Promise<void>;
}) {
	const navigate = useNavigate();
	const [detailData, setDetailData] = React.useState<DashboardRequest | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const [loadError, setLoadError] = React.useState(false);
	const [reloadKey, setReloadKey] = React.useState(0);
	const [rejectModalStatus, setRejectModalStatus] = React.useState<
		"Ditolak" | "Dibatalkan" | null
	>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		if (!open || !item?.id) {
			setDetailData(null);
			setLoadError(false);
			setIsLoading(false);
			return;
		}

		const controller = new AbortController();
		setDetailData(null);
		setLoadError(false);
		setIsLoading(true);

		(async () => {
			try {
				const response = await api.get(`/requests/${item.id}`, {
					signal: controller.signal,
				});
				if (!controller.signal.aborted) setDetailData(mapDetail(response.data));
			} catch (error) {
				if (controller.signal.aborted) return;
				console.error("Gagal memuat detail request:", error);
				setLoadError(true);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		})();

		return () => controller.abort();
	}, [open, item?.id, reloadKey]);

	if (!item) return null;

	const displayItem = detailData || item;
	const status = normalizeKey(displayItem.status);
	const rusak = isRusakType(displayItem.type || item.type);
	const isAllocated = ALLOCATED_STATUSES.includes(status);
	const isRejected = REJECTED_STATUSES.includes(status);
	const requestItems = displayItem.requestItems ?? [];
	const allocations = displayItem.requestAllocations ?? [];
	const allocationsTotal = allocations.reduce((acc, row) => acc + (row.quantity || 0), 0);
	const itemsTotal = requestItems.reduce((acc, row) => acc + (row.quantity || 0), 0);
	const driveViewUrl = displayItem.deliveryDocument?.driveViewUrl;

	const mobileItems: MobileItem[] = isAllocated
		? allocations.map((row) => ({
				id: String(row.id),
				title: row.materialName || "-",
				subtitle: [row.materialCategory, row.brand].filter(Boolean).join(" · "),
				code: row.materialNumber || undefined,
				quantity: row.quantity ?? 1,
				unit: row.unit || "Unit",
				serialNumber: row.serialNumber,
				showSerial: status === "SELESAI",
			}))
		: requestItems.map((row) => ({
				id: String(row.id),
				title: getCleanCategoryName(row.category),
				subtitle: row.brand || undefined,
				quantity: row.quantity,
				unit: row.unit || "Unit",
				serialNumber: row.serialNumber,
				showSerial: rusak,
			}));

	const notes = (displayItem.notes || "").trim();
	const rejectionNotes = (displayItem.rejectionNotes || "").trim();
	const adminRemarks = (displayItem.adminRemarks || "").trim();
	const hasNotes = (notes && notes !== "-") || (isRejected && rejectionNotes) || adminRemarks;

	const handleAction = async (newStatus: string) => {
		if (!displayItem?.id || !onStatusChange || isSubmitting) return;

		// Siapkan: lanjut ke halaman penyiapan alokasi, bukan ubah status langsung.
		if (newStatus === "Siap") {
			onClose();
			navigate(`/request/${displayItem.id}/prepare`);
			return;
		}

		if (newStatus === "Ditolak" || newStatus === "Dibatalkan") {
			setRejectModalStatus(newStatus);
			return;
		}

		setIsSubmitting(true);
		try {
			await onStatusChange(displayItem.id, newStatus);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRejectConfirm = async (note: string) => {
		if (!displayItem?.id || !onStatusChange || !rejectModalStatus) return;
		const nextStatus = rejectModalStatus;
		setRejectModalStatus(null);
		setIsSubmitting(true);
		try {
			await onStatusChange(displayItem.id, nextStatus, note);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Drawer direction="bottom" open={open} onOpenChange={(next) => !next && onClose()}>
				<DrawerContent className="max-h-[88vh] gap-0 p-0">
					<DrawerHeader className="shrink-0 gap-2 border-b border-border px-4 pb-4 text-left sm:px-6">
						<div className="flex items-start justify-between gap-3 text-left">
							<div className="flex min-w-0 flex-col gap-1.5">
								<div className="flex min-w-0 flex-wrap items-center gap-2">
									<DrawerTitle className="font-mono text-base font-medium tracking-tight text-foreground">
										{displayItem.requestNumber.toUpperCase()}
									</DrawerTitle>
									<StatusBadge status={displayItem.status} />
									<Badge tone={rusak ? "orange" : "indigo"}>
										{rusak ? "Material Rusak" : "Permintaan"}
									</Badge>
								</div>
							</div>
							<DrawerClose asChild>
								<Button
									size="icon-sm"
									variant="ghost"
									className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
									aria-label="Tutup detail permintaan"
								>
									<X className="size-4" />
								</Button>
							</DrawerClose>
						</div>
					</DrawerHeader>

					<div className="min-h-0 flex-1 overflow-y-auto">
						<div className="flex flex-col gap-5 px-4 py-4 text-sm sm:px-6">
							{isLoading ? (
								<DetailSkeleton />
							) : loadError ? (
								<DetailError onRetry={() => setReloadKey((key) => key + 1)} />
							) : (
								<>
									<dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-4">
										<MetaField
											label="Mitra"
											value={displayItem.requesterName}
										/>
										<MetaField
											label="Kategori"
											value={displayItem.partnerCategory}
										/>
										<MetaField
											label="Diajukan"
											value={formatDate(displayItem.requestedAt)}
											mono
										/>
										<MetaField
											label="Jumlah"
											value={`${displayItem.itemsCount ?? itemsTotal} unit`}
											mono
										/>
									</dl>

									<section className="space-y-2">
										<SectionHeading
											title={
												isAllocated
													? "Material Dialokasikan"
													: "Material Diminta"
											}
											meta={
												isAllocated
													? `${allocationsTotal} unit`
													: `${requestItems.length} jenis`
											}
										/>
										<div className="sm:hidden">
											<MobileItemList
												items={mobileItems}
												emptyTitle={
													isAllocated
														? "Belum ada alokasi material"
														: "Tidak ada item"
												}
												emptyDescription={
													isAllocated
														? "Alokasi unit akan tampil di sini setelah material disiapkan."
														: "Permintaan ini tidak memuat rincian material."
												}
											/>
										</div>
										<div className="hidden overflow-hidden rounded-md border border-border sm:block">
											{isAllocated ? (
												<Table className="text-xs">
													<TableHeader className="bg-muted/40">
														<TableRow className="hover:bg-transparent">
															<TableHead className="h-9 w-10">
																No
															</TableHead>
															<TableHead className="h-9">
																Kategori
															</TableHead>
															<TableHead className="h-9">
																No. Material
															</TableHead>
															<TableHead className="h-9">
																Nama Material
															</TableHead>
															<TableHead className="h-9">
																Merek
															</TableHead>
															{status === "SELESAI" && (
																<TableHead className="h-9">
																	SN
																</TableHead>
															)}
															<TableHead className="h-9 w-28 text-right">
																Jumlah
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{allocations.length > 0 ? (
															allocations.map((row, index) => (
																<TableRow key={row.id}>
																	<TableCell className="py-2 text-center text-muted-foreground">
																		{index + 1}
																	</TableCell>
																	<TableCell className="py-2 whitespace-nowrap">
																		{row.materialCategory ||
																			"-"}
																	</TableCell>
																	<TableCell
																		className="max-w-40 truncate py-2 font-mono text-muted-foreground"
																		title={row.materialNumber}
																	>
																		{row.materialNumber || "-"}
																	</TableCell>
																	<TableCell
																		className="max-w-64 truncate py-2"
																		title={row.materialName}
																	>
																		{row.materialName || "-"}
																	</TableCell>
																	<TableCell className="py-2 whitespace-nowrap">
																		{row.brand || "-"}
																	</TableCell>
																	{status === "SELESAI" && (
																		<TableCell
																			className="max-w-44 truncate py-2 font-mono text-muted-foreground"
																			title={
																				row.serialNumber ||
																				undefined
																			}
																		>
																			{row.serialNumber ||
																				"-"}
																		</TableCell>
																	)}
																	<TableCell className="py-2 text-right font-medium tabular-nums whitespace-nowrap">
																		{row.quantity ?? 1}
																		<span className="ml-1 text-muted-foreground">
																			{row.unit || "Unit"}
																		</span>
																	</TableCell>
																</TableRow>
															))
														) : (
															<EmptyTableState
																colSpan={
																	status === "SELESAI" ? 7 : 6
																}
																title="Belum ada alokasi material"
																description="Alokasi unit akan tampil di sini setelah material disiapkan."
															/>
														)}
													</TableBody>
												</Table>
											) : (
												<Table className="text-xs">
													<TableHeader className="bg-muted/40">
														<TableRow className="hover:bg-transparent">
															<TableHead className="h-9 w-10">
																No
															</TableHead>
															<TableHead className="h-9">
																Kategori
															</TableHead>
															<TableHead className="h-9">
																Merek
															</TableHead>
															{rusak && (
																<TableHead className="h-9">
																	Serial No
																</TableHead>
															)}
															<TableHead className="h-9 w-28 text-right">
																Jumlah
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{requestItems.length > 0 ? (
															requestItems.map((row, index) => (
																<TableRow key={row.id}>
																	<TableCell className="py-2 text-center text-muted-foreground">
																		{index + 1}
																	</TableCell>
																	<TableCell className="py-2 font-medium whitespace-nowrap">
																		{getCleanCategoryName(
																			row.category,
																		)}
																	</TableCell>
																	<TableCell className="py-2 whitespace-nowrap">
																		{row.brand || "-"}
																	</TableCell>
																	{rusak && (
																		<TableCell
																			className="max-w-44 truncate py-2 font-mono text-muted-foreground"
																			title={
																				row.serialNumber ||
																				undefined
																			}
																		>
																			{row.serialNumber ||
																				"-"}
																		</TableCell>
																	)}
																	<TableCell className="py-2 text-right font-medium tabular-nums whitespace-nowrap">
																		{row.quantity}
																		<span className="ml-1 text-muted-foreground">
																			{row.unit || "Unit"}
																		</span>
																	</TableCell>
																</TableRow>
															))
														) : (
															<EmptyTableState
																colSpan={rusak ? 5 : 4}
																title="Tidak ada item"
																description="Permintaan ini tidak memuat rincian material."
															/>
														)}
													</TableBody>
												</Table>
											)}
										</div>
									</section>

									{hasNotes ? (
										<section className="space-y-2">
											<SectionHeading title="Catatan" />
											<div className="flex flex-col gap-2">
												{notes && notes !== "-" ? (
													<NoteBlock
														label="Catatan Mitra"
														value={notes}
													/>
												) : null}
												{isRejected && rejectionNotes ? (
													<NoteBlock
														label="Catatan Penolakan"
														value={rejectionNotes}
														destructive
													/>
												) : null}
												{adminRemarks ? (
													<NoteBlock
														label="Catatan Admin"
														value={adminRemarks}
													/>
												) : null}
											</div>
										</section>
									) : null}

									{driveViewUrl ? (
										<section className="space-y-2">
											<SectionHeading title="Dokumen" />
											<a
												href={driveViewUrl}
												target="_blank"
												rel="noreferrer"
												className="group flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
											>
												<span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
													<FileText
														className="size-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<span className="truncate">
														BAST Pengambilan Material
													</span>
												</span>
												<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
													Buka di Drive
													<ArrowUpRight
														className="size-3.5"
														aria-hidden="true"
													/>
												</span>
											</a>
										</section>
									) : null}
								</>
							)}
						</div>
					</div>

					<DrawerFooter className="shrink-0 border-t border-border px-4 py-3 sm:px-6">
						<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
							<DrawerClose asChild>
								<Button variant="outline" className="sm:mr-auto">
									Tutup
								</Button>
							</DrawerClose>

							{status === "MENUNGGU" && (
								<>
									<Button
										variant="destructive"
										disabled={isSubmitting}
										onClick={() => handleAction("Ditolak")}
									>
										Tolak Permintaan
									</Button>
									{rusak ? (
										<Button
											disabled={isSubmitting}
											onClick={() => handleAction("DISETUJUI")}
										>
											{isSubmitting ? (
												<Loader2 className="size-4 animate-spin" />
											) : null}
											Setujui Pengajuan
										</Button>
									) : (
										<Button
											onClick={() =>
												navigate(`/request/${displayItem.id}/prepare`)
											}
										>
											Siapkan Material
										</Button>
									)}
								</>
							)}

							{status === "SIAP" && (
								<>
									<Button
										variant="destructive"
										disabled={isSubmitting}
										onClick={() => handleAction("Dibatalkan")}
									>
										Batalkan
									</Button>
									<Button
										onClick={() =>
											navigate(`/request/${displayItem.id}/prepare`)
										}
									>
										Edit Alokasi
									</Button>
								</>
							)}

							{rusak && status === "SERAH" && (
								<Button
									disabled={isSubmitting}
									onClick={() => handleAction("SELESAI")}
								>
									{isSubmitting ? (
										<Loader2 className="size-4 animate-spin" />
									) : null}
									Selesaikan Pengajuan
								</Button>
							)}
						</div>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>

			<RejectRequestModal
				open={rejectModalStatus !== null}
				onOpenChange={(next) => !next && setRejectModalStatus(null)}
				requestNumber={displayItem.requestNumber}
				title={rejectModalStatus === "Ditolak" ? "Tolak Permintaan" : "Batalkan Permintaan"}
				description={
					rejectModalStatus === "Ditolak"
						? "Permintaan akan berstatus Ditolak dan alokasi material akan dilepas."
						: "Permintaan akan berstatus Dibatalkan dan alokasi material akan dilepas."
				}
				confirmLabel={
					rejectModalStatus === "Ditolak" ? "Tolak Permintaan" : "Batalkan Permintaan"
				}
				onConfirm={handleRejectConfirm}
			/>
		</>
	);
}
