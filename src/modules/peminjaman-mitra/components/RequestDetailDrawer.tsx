import * as React from "react";
import { ArrowUpRight, FileText, Loader2, PackageOpen, X } from "lucide-react";
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
import { StatusBadge } from "@/shared/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { getBaseUrl } from "@/shared/lib/api";
import type { InterMitraRequest } from "../types";

type RequestDetailDrawerProps = {
	request: InterMitraRequest | null;
	open: boolean;
	onClose: () => void;
	actionId: string | null;
	onApprove: (request: InterMitraRequest) => void;
	onReject: (request: InterMitraRequest) => void;
};

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

const REJECTED_STATUSES = ["DITOLAK", "DIBATALKAN"];
/** Status yang sudah punya dokumen BAST untuk diunduh. */
const BAST_STATUSES = ["DISETUJUI", "SERAH", "SELESAI"];

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

function EmptyItems() {
	return (
		<div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
			<PackageOpen className="size-5 text-muted-foreground" aria-hidden="true" />
			<p className="text-sm font-medium text-foreground">Tidak ada item</p>
			<p className="max-w-sm text-xs text-muted-foreground">
				Permintaan ini tidak memuat rincian material.
			</p>
		</div>
	);
}

/** Daftar item untuk layar sempit — tabel enam kolom tidak terbaca di ponsel. */
function ItemCardList({ items }: { items: NonNullable<InterMitraRequest["requestItems"]> }) {
	return (
		<ul className="divide-y divide-border rounded-md border border-border">
			{items.map((item) => (
				<li key={item.id} className="flex flex-col gap-2 p-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground">
								{item.category || "-"}
							</p>
							<p className="mt-0.5 truncate text-xs text-muted-foreground">
								{item.brand || "-"}
							</p>
						</div>
						<p className="shrink-0 font-mono text-xs tabular-nums text-foreground">
							{item.quantity}
							<span className="ml-1 text-muted-foreground">Unit</span>
						</p>
					</div>
					<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
						<dt className="meta-label">SN Diberikan</dt>
						<dd
							className="truncate font-mono text-muted-foreground"
							title={item.donorSerialNumbers || undefined}
						>
							{item.donorSerialNumbers || "-"}
						</dd>
						<dt className="meta-label">SN Diterima</dt>
						<dd
							className="truncate font-mono text-muted-foreground"
							title={item.receiverSerialNumbers || undefined}
						>
							{item.receiverSerialNumbers || "-"}
						</dd>
					</dl>
				</li>
			))}
		</ul>
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

/**
 * Drawer detail permintaan material antar mitra. Menampilkan ringkasan pihak
 * yang bertransaksi, rincian item beserta serial number, catatan, dan dokumen
 * BAST — dengan aksi setujui/tolak selama status masih Menunggu.
 */
export function RequestDetailDrawer({
	request,
	open,
	onClose,
	actionId,
	onApprove,
	onReject,
}: RequestDetailDrawerProps) {
	if (!request) return null;

	const status = normalizeKey(request.status);
	const pending = status === "MENUNGGU";
	const busy = actionId === request.id;
	const isRejected = REJECTED_STATUSES.includes(status);

	const items = request.requestItems ?? [];
	const itemsTotal = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
	const notes = (request.notes || "").trim();
	const rejectionNotes = (request.rejectionNotes || "").trim();
	const hasAnyNote = (notes && notes !== "-") || (isRejected && rejectionNotes);

	const driveViewUrl = request.deliveryDocument?.driveViewUrl;
	const bastHref =
		BAST_STATUSES.includes(status) && request.id
			? driveViewUrl || `${getBaseUrl()}/requests/${request.id}/bast-pdf`
			: null;

	return (
		<Drawer direction="bottom" open={open} onOpenChange={(next) => !next && onClose()}>
			<DrawerContent className="max-h-[88vh] gap-0 p-0">
				<DrawerHeader className="shrink-0 gap-2 border-b border-border px-4 pb-4 text-left sm:px-6">
					<div className="flex items-start justify-between gap-3 text-left">
						<div className="flex min-w-0 flex-col gap-1.5">
							<div className="flex min-w-0 flex-wrap items-center gap-2">
								<DrawerTitle className="font-mono text-base font-medium tracking-tight text-foreground">
									{request.requestNumber.toUpperCase()}
								</DrawerTitle>
								<StatusBadge status={request.status} size="sm" />
								<Badge variant="quiet" size="sm" tone="indigo">
									Antar Mitra
								</Badge>
							</div>
							<DrawerDescription className="truncate text-xs text-muted-foreground">
								{[request.requesterName, request.providerName]
									.filter(Boolean)
									.join(" → ") || "Permintaan material antar mitra"}
							</DrawerDescription>
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
						<dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-4">
							<MetaField label="Mitra Peminta" value={request.requesterName} />
							<MetaField label="Mitra Pemberi" value={request.providerName} />
							<MetaField
								label="Diajukan"
								value={formatDate(request.requestedAt)}
								mono
							/>
							<MetaField
								label="Jumlah"
								value={`${request.itemsCount ?? itemsTotal} unit`}
								mono
							/>
						</dl>

						<section className="space-y-2">
							<SectionHeading
								title="Material Diminta"
								meta={`${items.length} jenis`}
							/>
							{items.length === 0 ? (
								<div className="rounded-md border border-border">
									<EmptyItems />
								</div>
							) : (
								<>
									<div className="sm:hidden">
										<ItemCardList items={items} />
									</div>
									<div className="hidden overflow-hidden rounded-md border border-border sm:block">
										<Table className="text-xs">
											<TableHeader className="bg-muted/40">
												<TableRow className="hover:bg-transparent">
													<TableHead className="h-9 w-10">No</TableHead>
													<TableHead className="h-9">Kategori</TableHead>
													<TableHead className="h-9">Merek</TableHead>
													<TableHead className="h-9 w-28 text-right">
														Jumlah
													</TableHead>
													<TableHead className="h-9 w-[26%]">
														SN Diberikan
													</TableHead>
													<TableHead className="h-9 w-[26%]">
														SN Diterima
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{items.map((item, index) => (
													<TableRow key={item.id}>
														<TableCell className="py-2 text-center tabular-nums text-muted-foreground">
															{index + 1}
														</TableCell>
														<TableCell className="py-2 whitespace-nowrap">
															{item.category || "-"}
														</TableCell>
														<TableCell className="py-2 whitespace-nowrap">
															{item.brand || "-"}
														</TableCell>
														<TableCell className="py-2 text-right font-medium tabular-nums whitespace-nowrap">
															{item.quantity}
															<span className="ml-1 font-normal text-muted-foreground">
																Unit
															</span>
														</TableCell>
														<TableCell
															className="max-w-0 truncate py-2 font-mono text-muted-foreground"
															title={
																item.donorSerialNumbers || undefined
															}
														>
															{item.donorSerialNumbers || "-"}
														</TableCell>
														<TableCell
															className="max-w-0 truncate py-2 font-mono text-muted-foreground"
															title={
																item.receiverSerialNumbers ||
																undefined
															}
														>
															{item.receiverSerialNumbers || "-"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}
						</section>

						{hasAnyNote ? (
							<section className="space-y-2">
								<SectionHeading title="Catatan" />
								<div className="flex flex-col gap-2">
									{notes && notes !== "-" ? (
										<NoteBlock label="Catatan Peminta" value={notes} />
									) : null}
									{isRejected && rejectionNotes ? (
										<NoteBlock
											label="Catatan Penolakan"
											value={rejectionNotes}
											destructive
										/>
									) : null}
								</div>
							</section>
						) : null}

						{bastHref ? (
							<section className="space-y-2">
								<SectionHeading title="Dokumen" />
								<a
									href={bastHref}
									target="_blank"
									rel="noreferrer"
									className="group flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
								>
									<span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
										<FileText
											className="size-4 shrink-0 text-muted-foreground"
											aria-hidden="true"
										/>
										<span className="truncate">BAST Serah Terima Material</span>
									</span>
									<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
										{driveViewUrl ? "Buka di Drive" : "Unduh PDF"}
										<ArrowUpRight className="size-3.5" aria-hidden="true" />
									</span>
								</a>
							</section>
						) : null}
					</div>
				</div>

				<DrawerFooter className="shrink-0 border-t border-border px-4 py-3 sm:px-6">
					<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
						<DrawerClose asChild>
							<Button variant="outline" className="sm:mr-auto">
								Tutup
							</Button>
						</DrawerClose>

						{pending && (
							<>
								<Button
									variant="destructive"
									disabled={busy}
									onClick={() => onReject(request)}
								>
									Tolak Permintaan
								</Button>
								<Button disabled={busy} onClick={() => onApprove(request)}>
									{busy ? <Loader2 className="size-4 animate-spin" /> : null}
									Setujui Permintaan
								</Button>
							</>
						)}
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
