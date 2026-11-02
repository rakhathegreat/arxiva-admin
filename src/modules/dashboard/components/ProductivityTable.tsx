import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, X } from "lucide-react";
import type { MitraPerformanceMetrics } from "@/modules/dashboard/types";

interface ProductivityTableProps {
	metrics: MitraPerformanceMetrics[];
	isLoading: boolean;
	className?: string;
	activeHoverId?: string | null;
	onHoverMitra?: (id: string | null) => void;
}

type SortField =
	| "name"
	| "requestCount"
	| "totalItems"
	| "averageLifespanDays"
	| "daysSinceLastRequest"
	| "status";
type SortOrder = "asc" | "desc";

const getBadgeStyle = (status: MitraPerformanceMetrics["status"]) => {
	switch (status) {
		case "Fast":
			return "border-success/25 bg-success/10 text-success";
		case "Steady":
			return "border-border bg-muted text-charcoal";
		case "Slow":
			return "border-border bg-foreground/5 text-foreground";
		case "Idle":
			return "border-transparent bg-inverted text-inverted-foreground";
		default:
			return "border-border bg-muted text-stone";
	}
};

function ProductivityTableBase({
	metrics,
	isLoading,
	className,
	activeHoverId,
	onHoverMitra,
}: ProductivityTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("All");
	const [sortField, setSortField] = useState<SortField>("averageLifespanDays");
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const renderSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40 inline" />;
		}
		return sortOrder === "asc" ? (
			<ArrowUp className="ml-1 h-3 w-3 text-primary inline" />
		) : (
			<ArrowDown className="ml-1 h-3 w-3 text-primary inline" />
		);
	};

	const filteredAndSortedMetrics = useMemo(() => {
		return metrics
			.filter((m) => {
				const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
				const matchesStatus = statusFilter === "All" || m.status === statusFilter;
				return matchesSearch && matchesStatus;
			})
			.sort((a, b) => {
				// Handle priority sorting for null values
				const valA = a[sortField];
				const valB = b[sortField];

				if (valA === null || valA === undefined) return 1;
				if (valB === null || valB === undefined) return -1;

				if (typeof valA === "string" && typeof valB === "string") {
					return sortOrder === "asc"
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}

				return sortOrder === "asc"
					? (valA as number) - (valB as number)
					: (valB as number) - (valA as number);
			});
	}, [metrics, searchTerm, statusFilter, sortField, sortOrder]);

	const maxLifespan = useMemo(() => {
		const valid = metrics
			.map((m) => m.averageLifespanDays)
			.filter((days): days is number => days !== null && days > 0);
		return valid.length > 0 ? Math.max(...valid) : 30;
	}, [metrics]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<Skeleton className="h-6 w-48 mb-1" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-40 w-full rounded-md" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const filterTabs = [
		{ label: "Semua", value: "All" },
		{ label: "Fast", value: "Fast" },
		{ label: "Steady", value: "Steady" },
		{ label: "Slow", value: "Slow" },
		{ label: "Idle", value: "Idle" },
	];

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-base font-medium">
							Analisis Produktivitas Mitra
						</CardTitle>
						<CardDescription>Rincian kecepatan perputaran per mitra</CardDescription>
					</div>
				</div>

				{/* Search Bar & Filter Status Toolbar */}
				<div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:w-64">
						<Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground select-none" />
						<Input
							type="search"
							role="searchbox"
							aria-label="Cari nama mitra"
							placeholder="Cari nama mitra..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setSearchTerm("");
								}
							}}
							className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-border/80 focus:bg-card focus:border-foreground/30 placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
							autoComplete="off"
							spellCheck={false}
						/>
						{searchTerm && (
							<button
								type="button"
								onClick={() => setSearchTerm("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
								aria-label="Hapus pencarian"
							>
								<X className="size-3.5" />
							</button>
						)}
					</div>

					{/* Filter Status Tabs */}
					<div className="overflow-x-auto max-w-full pb-0.5 sm:pb-0">
						<Tabs value={statusFilter} onValueChange={setStatusFilter}>
							<TabsList className="h-8 p-0.5 bg-muted/60 border border-border/80 rounded-md gap-0.5">
								{filterTabs.map((tab) => {
									return (
										<TabsTrigger
											key={tab.value}
											value={tab.value}
											className="text-xs px-2.5 h-7 rounded-sm data-active:bg-card data-active:text-foreground data-active:shadow-xs data-active:border-border data-active:rounded-md cursor-pointer transition-colors gap-1.5"
										>
											<span>{tab.label}</span>
										</TabsTrigger>
									);
								})}
							</TabsList>
						</Tabs>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead
									onClick={() => handleSort("name")}
									className="cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Nama Mitra {renderSortIcon("name")}
								</TableHead>
								<TableHead
									onClick={() => handleSort("requestCount")}
									className="text-center cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Total BAST {renderSortIcon("requestCount")}
								</TableHead>
								<TableHead
									onClick={() => handleSort("totalItems")}
									className="text-center cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Total Item {renderSortIcon("totalItems")}
								</TableHead>
								<TableHead
									onClick={() => handleSort("averageLifespanDays")}
									className="text-center cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Avg. Lifespan {renderSortIcon("averageLifespanDays")}
								</TableHead>
								<TableHead
									onClick={() => handleSort("daysSinceLastRequest")}
									className="text-center cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Days Idle {renderSortIcon("daysSinceLastRequest")}
								</TableHead>
								<TableHead
									onClick={() => handleSort("status")}
									className="text-center cursor-pointer select-none hover:text-foreground font-medium text-xs"
								>
									Status {renderSortIcon("status")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAndSortedMetrics.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center text-muted-foreground h-24 text-sm"
									>
										Tidak ada data mitra yang sesuai filter.
									</TableCell>
								</TableRow>
							) : (
								filteredAndSortedMetrics.map((mitra) => {
									const isHovered = activeHoverId === mitra.id;
									const isIdle = mitra.status === "Idle" || mitra.isIdleStock;
									const lifespanDays = mitra.averageLifespanDays;
									const percentWidth =
										lifespanDays !== null && maxLifespan > 0
											? Math.min(
													100,
													Math.max(
														10,
														Math.round(
															(lifespanDays / maxLifespan) * 100,
														),
													),
												)
											: 0;

									return (
										<TableRow
											key={mitra.id}
											onMouseEnter={() => onHoverMitra?.(mitra.id)}
											onMouseLeave={() => onHoverMitra?.(null)}
											className={`transition-colors duration-150 ${
												isHovered
													? "bg-muted/60"
													: isIdle
														? "border-l-2 border-l-foreground bg-muted/30 hover:bg-muted/60"
														: "hover:bg-muted/40"
											}`}
										>
											<TableCell className="font-medium text-xs">
												<div className="flex items-center gap-1.5">
													{isIdle && (
														<AlertTriangle className="h-3.5 w-3.5 text-foreground shrink-0" />
													)}
													<span>{mitra.name}</span>
												</div>
											</TableCell>
											<TableCell className="text-center text-xs">
												{mitra.requestCount}
											</TableCell>
											<TableCell className="text-center text-xs">
												{mitra.totalItems}
											</TableCell>

											{/* Avg. Lifespan Column with Mini Progress Meter */}
											<TableCell className="text-center text-xs">
												{lifespanDays !== null ? (
													<div className="flex flex-col items-center gap-1">
														<span className="font-medium">
															{lifespanDays} Hari
														</span>
														<div className="w-16 bg-muted h-1 rounded-full overflow-hidden">
															<div
																className={`h-full rounded-full ${
																	lifespanDays <= 7
																		? "bg-success"
																		: lifespanDays <= 14
																			? "bg-charcoal"
																			: "bg-stone"
																}`}
																style={{
																	width: `${percentWidth}%`,
																}}
															/>
														</div>
													</div>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>

											<TableCell className="text-center text-xs">
												<span
													className={
														mitra.daysSinceLastRequest >= 30
															? "text-foreground font-medium"
															: ""
													}
												>
													{mitra.daysSinceLastRequest} Hari
												</span>
											</TableCell>

											<TableCell className="text-center">
												<Badge
													variant="secondary"
													size="sm"
													className={getBadgeStyle(mitra.status)}
												>
													{mitra.status}
												</Badge>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

export const ProductivityTable = memo(ProductivityTableBase);
