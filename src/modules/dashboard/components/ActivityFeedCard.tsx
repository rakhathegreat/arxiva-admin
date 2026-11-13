import { ArrowUpRight } from "lucide-react";
import { useState, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import type { SystemEvent } from "@/modules/log-aktivitas/types";
import {
	actionLabel,
	formatLogDateParts,
	roleLabel,
	statusLabel,
} from "@/modules/log-aktivitas/utils/log";

interface ActivityFeedCardProps {
	events: SystemEvent[];
	isLoading: boolean;
	error?: string | null;
	canView?: boolean;
	className?: string;
}

const STATUS_DOT: Record<SystemEvent["status"], string> = {
	SUCCESS: "bg-success",
	FAILED: "bg-rose-600 dark:bg-rose-400",
};

function actorName(event: SystemEvent): string {
	return event.actorName || event.actorUsername || "Sistem";
}

function ActivityFeedCardBase({
	events,
	isLoading,
	error,
	canView = true,
	className,
}: ActivityFeedCardProps) {
	const navigate = useNavigate();
	const [showTopGradient, setShowTopGradient] = useState(false);
	const [showBottomGradient, setShowBottomGradient] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const openLogPage = () => navigate("/log-aktivitas");

	const checkScroll = () => {
		const el = scrollRef.current;
		if (!el) return;
		const { scrollTop, scrollHeight, clientHeight } = el;
		setShowTopGradient(scrollTop > 0);
		setShowBottomGradient(scrollTop + clientHeight < scrollHeight - 1.5);
	};

	useEffect(() => {
		const timer = setTimeout(() => checkScroll(), 50);
		window.addEventListener("resize", checkScroll);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", checkScroll);
		};
	}, [events]);

	return (
		<Card className={cn("flex h-full flex-col", className)}>
			<CardHeader className="flex flex-row items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<CardTitle className="text-base">Log Aktivitas</CardTitle>
					<CardDescription>Event terbaru dari seluruh sistem</CardDescription>
				</div>
				<button
					type="button"
					onClick={openLogPage}
					aria-label="Buka halaman log aktivitas"
					title="Buka halaman log aktivitas"
					className={cn(
						"cursor-pointer rounded-full bg-muted p-1.5 transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none",
						!canView && "hidden",
					)}
				>
					<ArrowUpRight className="size-3.5 text-muted-foreground" />
				</button>
			</CardHeader>

			<div className="relative min-h-0 max-h-92 flex-1">
				<div
					className={cn(
						"pointer-events-none absolute -top-px right-0 left-0 z-10 h-12 bg-linear-to-b from-card to-transparent transition-opacity duration-300",
						showTopGradient ? "opacity-100" : "opacity-0",
					)}
				/>

				<div ref={scrollRef} onScroll={checkScroll} className="h-full overflow-y-auto">
					{!canView ? (
						<div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-10 text-center">
							<p className="text-xs font-medium text-foreground">Khusus admin</p>
							<p className="text-xs text-muted-foreground">
								Log aktivitas hanya dapat dilihat oleh admin.
							</p>
						</div>
					) : isLoading && events.length === 0 ? (
						<div className="flex flex-col px-4 py-2">
							{[1, 2, 3, 4, 5].map((index) => (
								<div key={index} className="flex items-start gap-3 py-2.5">
									<Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
									<div className="flex flex-1 flex-col gap-1.5">
										<div className="flex items-center justify-between gap-3">
											<Skeleton className="h-3 w-24" />
											<Skeleton className="h-2.5 w-12" />
										</div>
										<Skeleton className="h-2.5 w-40" />
										<Skeleton className="h-2 w-24" />
									</div>
								</div>
							))}
						</div>
					) : error && events.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-10 text-center">
							<p className="text-xs font-medium text-foreground">Gagal memuat log</p>
							<p className="max-w-56 text-xs text-muted-foreground">{error}</p>
							<button
								type="button"
								onClick={openLogPage}
								className="mt-2 cursor-pointer text-xs text-foreground underline decoration-1 underline-offset-4 hover:text-charcoal"
							>
								Buka halaman log
							</button>
						</div>
					) : events.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-10 text-center">
							<p className="text-xs font-medium text-foreground">
								Belum ada log aktivitas
							</p>
							<p className="max-w-56 text-xs text-muted-foreground">
								Event akan muncul di sini setelah ada perubahan data atau login.
							</p>
						</div>
					) : (
						<div className="flex flex-col divide-y divide-border/60">
							{events.map((event) => {
								const { time, full } = formatLogDateParts(event.occurredAt);
								return (
									<button
										key={event.id}
										type="button"
										onClick={openLogPage}
										title="Buka log aktivitas"
										className="flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none focus-visible:ring-inset"
									>
										<span
											aria-hidden="true"
											className={cn(
												"mt-1.5 size-1.5 shrink-0 rounded-full",
												STATUS_DOT[event.status],
											)}
										/>
										<span className="sr-only">{statusLabel(event.status)}</span>
										<span className="min-w-0 flex-1">
											<span className="flex items-baseline justify-between gap-2">
												<span className="truncate text-xs font-medium text-foreground">
													{actionLabel(event.action)}
												</span>
												<span className="flex shrink-0 items-center gap-1.5">
													{event.status === "FAILED" ? (
														<span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
															Gagal
														</span>
													) : null}
													<time
														dateTime={event.occurredAt}
														title={full}
														className="font-mono text-[10px] tabular-nums text-muted-foreground"
													>
														{time}
													</time>
												</span>
											</span>
											<span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">
												{event.summary}
											</span>
											<span className="mt-1 block truncate text-[10px] text-muted-foreground">
												{actorName(event)} · {roleLabel(event.actorRole)}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>

				<div
					className={cn(
						"pointer-events-none absolute -bottom-px right-0 left-0 z-10 h-12 bg-linear-to-t from-card to-transparent transition-opacity duration-300",
						showBottomGradient ? "opacity-100" : "opacity-0",
					)}
				/>
			</div>

			{canView ? (
				<div className="border-t border-border">
					<button
						type="button"
						onClick={openLogPage}
						className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-medium text-charcoal transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none focus-visible:ring-inset"
					>
						<span>Lihat semua log</span>
						<ArrowUpRight className="size-3.5" />
					</button>
				</div>
			) : null}
		</Card>
	);
}

export const ActivityFeedCard = memo(ActivityFeedCardBase);
