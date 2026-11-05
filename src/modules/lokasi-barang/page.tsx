import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowDownNarrowWide,
	ArrowUpNarrowWide,
	Check,
	ChevronDown,
	Plus,
	RefreshCw,
	Search,
	SortAsc,
	TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { migrateLocationItems } from "./api/lokasiApi";
import { useLokasiBarang } from "./hooks/useLokasiBarang";
import { useMaterialStats } from "./hooks/useMaterialStats";
import { LokasiCard, type LokasiCardActions } from "./components/LokasiCard";
import { WarehouseSummary } from "./components/WarehouseSummary";
import { MaterialSummary } from "./components/MaterialSummary";
import { LokasiEditorSheet } from "./components/LokasiEditorSheet";
import { DeleteLokasiDialog } from "./components/DeleteLokasiDialog";
import { MigrateDialog, flattenMigrateTargets } from "./components/MigrateDialog";
import { STORAGE_TYPES, getTypeConfig } from "./components/type-config";
import { downloadQrCode } from "./utils/downloadQr";

const FILTERS = [
	{ key: "rak", label: "Rak" },
	{ key: "kardus", label: "Kardus" },
	{ key: "pallet", label: "Pallet" },
] as const;

const SORT_OPTIONS = [
	{ value: "name", label: "Nama (A–Z)", icon: SortAsc },
	{ value: "util-desc", label: "Paling terisi", icon: ArrowDownNarrowWide },
	{ value: "util-asc", label: "Paling kosong", icon: ArrowUpNarrowWide },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/** Halaman Lokasi Material: kapasitas gudang, daftar penyimpanan, dan isi gudang. */
export default function LokasiBarangPage() {
	const navigate = useNavigate();
	const lokasi = useLokasiBarang();
	const material = useMaterialStats();

	const {
		locations,
		stats,
		isLoading,
		loadError,
		reload,
		filteredAndSortedLocations,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortBy,
		setSortBy,
		handleOpenSheet,
		handleToggleLocation,
		handleToggleLevel,
		requestDeleteLocation,
		requestDeleteLevel,
		isToggling,
		isDeleting,
	} = lokasi;

	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// "/" fokus ke pencarian, "Esc" bersihkan — pola yang sama dengan daftar lain.
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			const isInputActive =
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.tagName === "SELECT" ||
				target?.isContentEditable;

			if (e.key === "/" && !isInputActive) {
				e.preventDefault();
				searchInputRef.current?.focus();
				return;
			}
			if (e.key === "Escape" && !isInputActive && searchQuery !== "") {
				e.preventDefault();
				setSearchQuery("");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [searchQuery, setSearchQuery]);

	const [migrateTarget, setMigrateTarget] = React.useState<{
		sourceId: string;
		sourceLabel: string;
		itemCount: number;
	} | null>(null);
	const [isMigrating, setIsMigrating] = React.useState(false);

	const handleMigrate = async (targetId: string) => {
		if (!migrateTarget) return;
		setIsMigrating(true);
		try {
			const res = await migrateLocationItems(migrateTarget.sourceId, targetId);
			toast.success(res.message);
			setMigrateTarget(null);
			await reload();
			await material.reload();
		} catch (e: any) {
			toast.error(e.message || "Gagal memindahkan material.");
			throw e;
		} finally {
			setIsMigrating(false);
		}
	};

	const migrateTargets = React.useMemo(
		() => flattenMigrateTargets(locations, migrateTarget?.sourceId ?? ""),
		[locations, migrateTarget?.sourceId],
	);

	const cardActions = React.useMemo<LokasiCardActions>(
		() => ({
			onOpenSheet: handleOpenSheet,
			onToggleLocation: handleToggleLocation,
			onToggleLevel: handleToggleLevel,
			onDeleteLocation: requestDeleteLocation,
			onDeleteLevel: requestDeleteLevel,
			onDownloadQr: downloadQrCode,
			onViewItems: (query) => navigate(`/data-barang?search=${encodeURIComponent(query)}`),
			onMigrate: (sourceId, sourceLabel, itemCount) =>
				setMigrateTarget({ sourceId, sourceLabel, itemCount }),
		}),
		[
			handleOpenSheet,
			handleToggleLocation,
			handleToggleLevel,
			requestDeleteLocation,
			requestDeleteLevel,
			navigate,
		],
	);

	const counts: Record<FilterKey, number> = {
		rak: stats.totalRak,
		kardus: stats.totalKardus,
		pallet: stats.totalPallet,
	};

	const sortOption = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];
	const trimmedQuery = searchQuery.trim();
	const isFiltered = trimmedQuery !== "" || filterType !== "rak";

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 pb-10 md:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex max-w-xl flex-col gap-1">
					<h1 className="page-title">Lokasi Material</h1>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="sm"
							className="w-fit cursor-pointer gap-1.5 rounded-md font-medium"
						>
							Tambah lokasi
							<ChevronDown className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuGroup>
							{STORAGE_TYPES.map((type) => {
								const { addMode, icon: Icon } = getTypeConfig(type);
								return (
									<DropdownMenuItem
										key={type}
										className="cursor-pointer text-xs"
										onClick={() => handleOpenSheet(addMode)}
									>
										<Icon /> {type}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>

			<WarehouseSummary
				stats={stats}
				isLoading={isLoading}
				activeType={filterType}
				onSelectType={(type) => setFilterType(type)}
			/>

			<section aria-labelledby="daftar-lokasi" className="flex flex-col gap-3">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-baseline gap-2">
						<h2 id="daftar-lokasi" className="text-sm font-medium text-foreground">
							Lokasi penyimpanan
						</h2>
						<span
							className="text-xs tabular-nums text-muted-foreground"
							aria-live="polite"
						>
							{isLoading
								? "memuat…"
								: `${filteredAndSortedLocations.length} dari ${counts[filterType as FilterKey] ?? locations.length}`}
						</span>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
						<div className="relative w-full sm:w-60">
							<Search
								aria-hidden
								className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								ref={searchInputRef}
								type="search"
								placeholder="Cari lokasi atau merek"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										e.preventDefault();
										setSearchQuery("");
										searchInputRef.current?.blur();
									}
								}}
								className="h-8 pr-10 pl-8 text-xs"
							/>
							<span className="absolute top-1/2 right-2 -translate-y-1/2">
								{trimmedQuery !== "" ? (
									<Kbd
										className="pointer-events-auto cursor-pointer font-sans"
										onClick={() => {
											setSearchQuery("");
											searchInputRef.current?.blur();
										}}
										title="Tekan Esc untuk menghapus pencarian"
									>
										Esc
									</Kbd>
								) : (
									<Kbd title="Tekan / untuk mencari">/</Kbd>
								)}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<Tabs
								value={filterType}
								onValueChange={(val) => setFilterType(val as FilterKey)}
							>
								<TabsList className="inline-flex h-8 bg-accent/50 rounded-md p-0.5">
									{FILTERS.map((filter) => (
										<TabsTrigger
											key={filter.key}
											value={filter.key}
											className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 h-7 px-3 text-xs transition-colors hover:text-accent-foreground flex items-center gap-1.5"
										>
											<span>{filter.label}</span>
											<span className="tabular-nums opacity-60 font-normal">
												{counts[filter.key]}
											</span>
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 shrink-0 cursor-pointer gap-2 px-3 text-xs font-normal border-border bg-card hover:bg-accent hover:text-accent-foreground rounded-md transition-colors data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
									>
										<span className="hidden sm:inline text-muted-foreground">
											Sort By:
										</span>
										<span className="text-foreground">{sortOption.label}</span>
										<ChevronDown className="size-3 text-muted-foreground opacity-60" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-52 p-1 bg-card border-border"
								>
									<DropdownMenuGroup>
										{SORT_OPTIONS.map((option) => {
											const isSelected = sortBy === option.value;
											return (
												<DropdownMenuItem
													key={option.value}
													className={cn(
														"flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer rounded-md transition-colors",
														isSelected
															? "bg-accent text-accent-foreground"
															: "text-foreground hover:bg-accent/50",
													)}
													onClick={() =>
														setSortBy(option.value as SortValue)
													}
												>
													<div className="flex items-center gap-2">
														<span>{option.label}</span>
													</div>
													{isSelected && (
														<Check className="size-3.5 text-foreground shrink-0" />
													)}
												</DropdownMenuItem>
											);
										})}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>

				{loadError ? (
					<div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-4 py-8">
						<span className="flex items-center gap-2 text-sm font-medium text-foreground">
							<TriangleAlert className="size-4 text-muted-foreground" />
							Daftar lokasi gagal dimuat
						</span>
						<p className="max-w-md text-xs text-muted-foreground">{loadError}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => reload()}
							className="mt-1 cursor-pointer gap-1.5"
						>
							<RefreshCw className="size-3.5" /> Coba lagi
						</Button>
					</div>
				) : isLoading ? (
					<div
						className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3"
						aria-hidden
					>
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div
								key={i}
								className="flex flex-col rounded-md border border-border bg-card"
							>
								<div className="flex items-start gap-2.5 p-3.5">
									<Skeleton className="mt-px size-3.5 rounded-sm" />
									<div className="flex flex-1 flex-col gap-1.5">
										<Skeleton className="h-3.5 w-24" />
										<Skeleton className="h-2.5 w-32" />
									</div>
								</div>
								<div className="flex flex-col gap-2 border-t border-border px-3.5 py-3">
									<Skeleton className="h-1 w-full rounded-sm" />
									<div className="flex items-center justify-between gap-3">
										<Skeleton className="h-2.5 w-14" />
										<Skeleton className="h-2.5 w-20" />
									</div>
								</div>
							</div>
						))}
					</div>
				) : filteredAndSortedLocations.length === 0 ? (
					<div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-md border border-dashed border-border">
						<div className="size-10 bg-muted rounded-md flex items-center justify-center mb-4">
							<Search className="size-5 text-muted-foreground" />
						</div>
						<h3 className="mb-1 text-sm font-medium text-foreground">
							{isFiltered ? "Tidak Ada Lokasi yang Cocok" : "Belum Ada Data"}
						</h3>
						<p className="max-w-md text-sm text-muted-foreground">
							{isFiltered
								? `Tidak ditemukan${trimmedQuery ? ` hasil untuk “${trimmedQuery}”` : ""} pada tipe penyimpanan ini.`
								: "Tambahkan rak, kardus, atau pallet agar material bisa ditempatkan di gudang KP."}
						</p>
						{isFiltered ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									setFilterType("rak");
								}}
								className="mt-4 cursor-pointer rounded-md"
							>
								Bersihkan filter
							</Button>
						) : (
							<Button
								size="sm"
								onClick={() => handleOpenSheet("add-rak")}
								className="mt-4 cursor-pointer gap-1.5 rounded-md"
							>
								<Plus className="size-4" /> Tambah rak
							</Button>
						)}
					</div>
				) : (
					/* Grid, bukan masonry: kartu rak jauh lebih tinggi, tapi urutan
					   baca (kiri→kanan, atas→bawah) harus mengikuti sort yang dipilih. */
					<div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
						{filteredAndSortedLocations.map((loc) => (
							<LokasiCard
								key={loc.id}
								loc={loc}
								isToggling={isToggling}
								isDeleting={isDeleting}
								{...cardActions}
							/>
						))}
					</div>
				)}
			</section>

			<MaterialSummary
				data={material.data}
				isLoading={material.isLoading}
				error={material.error}
				onRetry={material.reload}
			/>

			<LokasiEditorSheet lokasi={lokasi} />
			<DeleteLokasiDialog lokasi={lokasi} />

			<MigrateDialog
				isOpen={migrateTarget !== null}
				sourceLabel={migrateTarget?.sourceLabel ?? ""}
				itemCount={migrateTarget?.itemCount ?? 0}
				targets={migrateTargets}
				isSubmitting={isMigrating}
				onSubmit={handleMigrate}
				onClose={() => setMigrateTarget(null)}
			/>
		</div>
	);
}
