import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { Clock, Trophy, Zap, Award, Info } from "lucide-react";
import type { MitraPerformanceMetrics } from "@/modules/dashboard/types";

interface LeaderboardCardProps {
	metrics: MitraPerformanceMetrics[];
	isLoading: boolean;
	className?: string;
	activeHoverId?: string | null;
	onHoverMitra?: (id: string | null) => void;
}

function LeaderboardCardBase({
	metrics,
	isLoading,
	className,
	activeHoverId,
	onHoverMitra,
}: LeaderboardCardProps) {
	const topPerformers = useMemo(
		() =>
			metrics
				.filter((m) => m.averageLifespanDays !== null && m.averageLifespanDays > 0)
				.sort(
					(a, b) => (a.averageLifespanDays as number) - (b.averageLifespanDays as number),
				)
				.slice(0, 5),
		[metrics],
	);

	const maxLifespan = useMemo(
		() =>
			topPerformers.length > 0
				? Math.max(...topPerformers.map((m) => m.averageLifespanDays as number))
				: 1,
		[topPerformers],
	);

	if (isLoading) {
		return (
			<Card className={`flex h-full w-full flex-col ${className}`}>
				<CardHeader>
					<Skeleton className="h-6 w-40 mb-1" />
					<Skeleton className="h-4 w-60" />
				</CardHeader>
				<CardContent className="flex-1 space-y-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<Skeleton className="h-9 w-9 rounded-full" />
								<div className="space-y-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	const getPodiumBadge = (index: number) => {
		switch (index) {
			case 0:
				return (
					<div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 bg-foreground/5 text-foreground">
						<Trophy className="h-4 w-4" />
					</div>
				);
			case 1:
				return (
					<div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-charcoal">
						<Award className="h-4 w-4 text-stone" />
					</div>
				);
			case 2:
				return (
					<div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/60 text-stone">
						<Award className="h-4 w-4 text-smoke" />
					</div>
				);
			default:
				return (
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-muted-foreground">
						{index + 1}
					</div>
				);
		}
	};

	return (
		<Card className={`flex h-full w-full flex-col ${className}`}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base font-medium">Top Velocity Mitra</CardTitle>
					</div>
				</div>
				<CardDescription>Mitra dengan perputaran BAST tercepat</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto">
				{topPerformers.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground gap-1 p-4">
						<h3 className="font-medium text-primary">Tidak Ada Data</h3>
						<p className="text-muted-foreground">Belum ada data metrik yang memadai.</p>
					</div>
				) : (
					<TooltipProvider>
						<div className="space-y-3">
							{topPerformers.map((mitra, index) => {
								const isHovered = activeHoverId === mitra.id;
								// Higher percentage = faster velocity (inverted from days)
								const relativeVelocityPercent =
									maxLifespan > 0
										? Math.max(
												15,
												Math.round(
													(1 -
														mitra.averageLifespanDays! /
															(maxLifespan * 1.2)) *
														100,
												),
											)
										: 50;

								return (
									<div
										key={mitra.id}
										onMouseEnter={() => onHoverMitra?.(mitra.id)}
										onMouseLeave={() => onHoverMitra?.(null)}
										className={`flex flex-col gap-2 rounded-md border p-2.5 transition-colors duration-150 ${
											isHovered
												? "border-foreground/20 bg-muted/60"
												: "border-border/60 hover:bg-muted/40 hover:border-border"
										}`}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-3">
												{getPodiumBadge(index)}
												<div>
													<p className="text-sm font-medium leading-tight">
														{mitra.name}
													</p>
													<p className="text-xs text-muted-foreground mt-0.5">
														{mitra.requestCount} Request •{" "}
														{mitra.totalItems} Items
													</p>
												</div>
											</div>
											<div className="flex flex-col items-end gap-0.5">
												<Badge variant="success" size="sm">
													{mitra.averageLifespanDays} Hari
												</Badge>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="text-[10px] text-muted-foreground flex items-center gap-0.5 cursor-help hover:text-foreground transition-colors">
															Rata-rata habis{" "}
															<Info className="h-2.5 w-2.5 opacity-60" />
														</span>
													</TooltipTrigger>
													<TooltipContent
														side="left"
														className="text-xs max-w-[200px]"
													>
														Rata-rata durasi stok sejak BAST diterima
														mitra hingga terpakai seluruhnya.
													</TooltipContent>
												</Tooltip>
											</div>
										</div>

										{/* Relative Velocity Bar Indicator */}
										<div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden flex items-center">
											<div
												className="h-full bg-foreground rounded-full transition-all duration-500"
												style={{ width: `${relativeVelocityPercent}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</TooltipProvider>
				)}
			</CardContent>
		</Card>
	);
}

export const LeaderboardCard = memo(LeaderboardCardBase);
