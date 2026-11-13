import * as React from "react";
import { ChevronLeft, ChevronRight, RefreshCw, ScrollText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table/DataTable";
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/utils";
import { useActivityLog } from "./hooks/useActivityLog";
import { LogFilterControls } from "./components/LogFilterControls";
import { LogDetailDialog } from "./components/LogDetailDialog";
import type { SystemEvent } from "./types";
import {
	actionLabel,
	actorInitials,
	formatLogDateParts,
	formatLogTime,
	roleLabel,
	statusLabel,
} from "./utils/log";

function ActorCell({ event }: { event: SystemEvent }) {
	const name = event.actorName || event.actorUsername || "Sistem";

	return (
		<div className="flex min-w-0 items-center gap-2">
			<span
				aria-hidden="true"
				className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-[9px] tracking-[0.04em] text-muted-foreground select-none"
			>
				{actorInitials(event.actorName, event.actorUsername)}
			</span>
			<div className="min-w-0">
				<p
					className="truncate text-xs text-foreground"
					title={event.actorUsername ? `@${event.actorUsername}` : name}
				>
					{name}
				</p>
				<p className="truncate text-[10px] text-muted-foreground">
					{roleLabel(event.actorRole)}
				</p>
			</div>
		</div>
	);
}

function useIsDesktop() {
	const [isDesktop, setIsDesktop] = React.useState(
		() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
	);

	React.useEffect(() => {
		const query = window.matchMedia("(min-width: 768px)");
		const onChange = () => setIsDesktop(query.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	return isDesktop;
}

function MobileListSkeleton() {
	return (
		<div className="flex flex-col gap-2" aria-hidden="true">
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					key={index}
					className="h-[76px] animate-pulse rounded-md border border-border bg-muted/40"
				/>
			))}
		</div>
	);
}

export default function LogAktivitasPage() {
	const {
		events,
		totalItems,
		counts,
		isLoading,
		isRefreshing,
		error,
		lastUpdated,
		search,
		setSearch,
		status,
		setStatus,
		entity,
		setEntity,
		range,
		setRange,
		page,
		setPage,
		pageSize,
		setPageSize,
		refresh,
		reload,
	} = useActivityLog();

	const [detailEvent, setDetailEvent] = React.useState<SystemEvent | null>(null);
	const searchInputRef = React.useRef<HTMLInputElement>(null);
	const isDesktop = useIsDesktop();

	const hasActiveFilter =
		search.trim() !== "" || status !== "all" || entity !== "all" || range !== "7d";
	const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));

	const resetFilters = React.useCallback(() => {
		setSearch("");
		setStatus("all");
		setEntity("all");
		setRange("7d");
	}, [setEntity, setRange, setSearch, setStatus]);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;

			const target = event.target as HTMLElement | null;
			const isInputActive =
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.tagName === "SELECT" ||
				target?.isContentEditable;

			if (event.key === "/" && !isInputActive && !detailEvent) {
				event.preventDefault();
				searchInputRef.current?.focus();
				return;
			}

			if (event.key === "Escape" && !isInputActive && !detailEvent && search !== "") {
				event.preventDefault();
				setSearch("");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [detailEvent, search, setSearch]);

	const columns = React.useMemo<ColumnDef<SystemEvent>[]>(
		() => [
			{
				id: "occurredAt",
				header: "Waktu",
				meta: { className: "w-[128px] whitespace-nowrap" },
				cell: ({ row }) => {
					const { time, date, full } = formatLogDateParts(row.original.occurredAt);
					return (
						<time
							dateTime={row.original.occurredAt}
							title={full}
							className="flex flex-col"
						>
							<span className="font-mono text-[11px] tabular-nums text-foreground">
								{time}
							</span>
							<span className="text-[11px] text-muted-foreground">{date}</span>
						</time>
					);
				},
			},
			{
				id: "actor",
				header: "Aktor",
				meta: { className: "w-[200px]" },
				cell: ({ row }) => <ActorCell event={row.original} />,
			},
			{
				id: "action",
				header: "Aksi",
				meta: { className: "w-[168px]" },
				cell: ({ row }) => (
					<span
						className="block truncate text-xs text-foreground"
						title={actionLabel(row.original.action)}
					>
						{actionLabel(row.original.action)}
					</span>
				),
			},
			{
				id: "summary",
				header: "Ringkasan",
				cell: ({ row }) => (
					<p
						className="max-w-[420px] truncate text-xs text-muted-foreground"
						title={row.original.summary}
					>
						{row.original.summary}
					</p>
				),
			},
			{
				id: "status",
				header: "Status",
				meta: { className: "w-[96px]" },
				cell: ({ row }) => (
					<StatusBadge
						status={row.original.status}
						label={statusLabel(row.original.status)}
						variant="quiet"
						size="md"
					/>
				),
			},
		],
		[],
	);

	const emptyAction = hasActiveFilter ? (
		<Button
			variant="outline"
			size="sm"
			className="cursor-pointer text-xs"
			onClick={resetFilters}
		>
			Bersihkan filter
		</Button>
	) : undefined;

	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="page-title">Log Aktivitas</h1>
					<p className="text-xs text-muted-foreground">
						Jejak audit perubahan data dan autentikasi di seluruh sistem.
					</p>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<span className="meta-label flex items-center gap-1.5">
						<span
							aria-hidden="true"
							className={cn(
								"size-1.5 rounded-full",
								error ? "bg-muted-foreground/40" : "bg-success",
							)}
						/>
						{error ? "Terputus" : "Live"}
					</span>
					{lastUpdated ? (
						<span className="meta-label tabular-nums">
							{formatLogTime(lastUpdated)}
						</span>
					) : null}
					<Button
						variant="outline"
						size="icon-sm"
						onClick={() => refresh()}
						disabled={isRefreshing}
						aria-label="Muat ulang log"
						title="Muat ulang log"
						className="cursor-pointer"
					>
						<RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
					</Button>
				</div>
			</header>

			{error ? (
				<div className="flex flex-1 items-center justify-center">
					<div className="rounded-md border border-dashed px-8 py-12 text-center">
						<p className="text-sm font-medium text-foreground">
							Log aktivitas gagal dimuat
						</p>
						<p className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-4 cursor-pointer gap-2 text-xs"
							onClick={() => reload()}
						>
							Coba lagi
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-3">
						<LogFilterControls
							search={search}
							onSearchChange={setSearch}
							searchInputRef={searchInputRef}
							status={status}
							onStatusChange={setStatus}
							entity={entity}
							onEntityChange={setEntity}
							range={range}
							onRangeChange={setRange}
						/>

						<div className="flex items-center justify-between gap-3">
							<p className="meta-label tabular-nums">
								{totalItems.toLocaleString("id-ID")} event
							</p>
							<p className="meta-label flex items-center gap-1.5 tabular-nums">
								<span
									aria-hidden="true"
									className={cn(
										"size-1.5 rounded-full",
										counts.failed > 0
											? "bg-rose-600 dark:bg-rose-400"
											: "bg-border",
									)}
								/>
								{counts.failed.toLocaleString("id-ID")} gagal
							</p>
						</div>
					</div>

					{/* Mobile: daftar ringkas; tabel desktop tidak di-mount agar autoPageSize tidak salah ukur. */}
					{!isDesktop ? (
						isLoading && events.length === 0 ? (
							<MobileListSkeleton />
						) : events.length === 0 ? (
							<div className="flex flex-col items-center rounded-md border border-dashed px-4 py-10 text-center">
								<div
									className="flex size-10 items-center justify-center rounded-md bg-muted"
									aria-hidden="true"
								>
									<ScrollText
										className="size-5 text-muted-foreground"
										strokeWidth={1.8}
									/>
								</div>
								<p className="mt-3 text-sm font-medium text-foreground">
									{hasActiveFilter
										? "Tidak ada event yang cocok"
										: "Belum ada log aktivitas"}
								</p>
								<p className="mt-1 max-w-xs text-xs text-muted-foreground">
									{hasActiveFilter
										? "Tidak ditemukan event sesuai kata kunci, status, atau rentang waktu saat ini."
										: "Event akan tercatat otomatis setelah ada perubahan data atau login."}
								</p>
								{emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<div className="overflow-hidden rounded-md border border-border bg-card">
									<ul className="divide-y divide-border">
										{events.map((event) => {
											const { time, date, full } = formatLogDateParts(
												event.occurredAt,
											);
											return (
												<li key={event.id}>
													<button
														type="button"
														onClick={() => setDetailEvent(event)}
														className="flex w-full flex-col gap-2 px-3.5 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none focus-visible:ring-inset"
													>
														<div className="flex items-start justify-between gap-3">
															<div className="min-w-0">
																<p className="text-xs font-medium text-foreground">
																	{actionLabel(event.action)}
																</p>
																<p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
																	{event.summary}
																</p>
															</div>
															<StatusBadge
																status={event.status}
																label={statusLabel(event.status)}
																variant="quiet"
																size="sm"
																className="shrink-0"
															/>
														</div>
														<div className="flex items-center justify-between gap-3">
															<span className="truncate text-[11px] text-muted-foreground">
																{event.actorName ||
																	event.actorUsername ||
																	"Sistem"}{" "}
																· {roleLabel(event.actorRole)}
															</span>
															<time
																dateTime={event.occurredAt}
																title={full}
																className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground"
															>
																{date} · {time}
															</time>
														</div>
													</button>
												</li>
											);
										})}
									</ul>
								</div>

								<div className="flex items-center justify-between gap-3">
									<p className="text-xs text-muted-foreground">
										Halaman {page} dari {totalPages}
									</p>
									<div className="flex items-center gap-1.5">
										<Button
											variant="outline"
											size="icon-sm"
											disabled={page <= 1}
											onClick={() => setPage(page - 1)}
											aria-label="Halaman sebelumnya"
											className="cursor-pointer"
										>
											<ChevronLeft className="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											disabled={page >= totalPages}
											onClick={() => setPage(page + 1)}
											aria-label="Halaman berikutnya"
											className="cursor-pointer"
										>
											<ChevronRight className="size-4" />
										</Button>
									</div>
								</div>
							</div>
						)
					) : null}

					{isDesktop ? (
						<DataTable<SystemEvent>
							data={events}
							columns={columns}
							isLoading={isLoading}
							onRowClick={setDetailEvent}
							pagination="server"
							totalItems={totalItems}
							page={page}
							onPageChange={setPage}
							pageSize={pageSize}
							onPageSizeChange={setPageSize}
							autoPageSize
							className="flex flex-1 flex-col gap-4 w-full min-h-0"
							emptyState={{
								icon: ScrollText,
								title: hasActiveFilter
									? "Tidak ada event yang cocok"
									: "Belum ada log aktivitas",
								description: hasActiveFilter
									? "Tidak ditemukan event sesuai kata kunci, status, atau rentang waktu saat ini."
									: "Event akan tercatat otomatis setelah ada perubahan data atau login.",
								action: emptyAction,
							}}
						/>
					) : null}
				</>
			)}

			<LogDetailDialog
				event={detailEvent}
				onOpenChange={(open) => {
					if (!open) setDetailEvent(null);
				}}
			/>
		</div>
	);
}
