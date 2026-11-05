import * as React from "react";
import {
	Bookmark,
	Check,
	ChevronLeft,
	ListFilter,
	MapPin,
	Tag,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { fetchAuxiliary } from "../api/barangApi";

type FilterView = "main" | "category" | "brand" | "location";

export interface BarangFilterPopoverProps {
	filterCategory: string;
	onCategoryChange: (category: string) => void;
	filterBrand: string;
	onBrandChange: (brand: string) => void;
	filterLocation: string;
	onLocationChange: (location: string) => void;
	className?: string;
}

function MenuRow({
	icon: Icon,
	label,
	isActive,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors cursor-pointer hover:bg-accent"
		>
			<div className="flex items-center">
				<Icon className="mr-1.5 inline size-4.5" />
				{label}
			</div>
			{isActive && (
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<Check className="size-3.5" />
				</div>
			)}
		</button>
	);
}

function OptionSubView({
	title,
	items,
	selectedValue,
	onSelect,
	onBack,
	searchQuery,
	onSearchQueryChange,
	searchPlaceholder,
	isLoading,
}: {
	title: string;
	items: string[];
	selectedValue: string;
	onSelect: (val: string) => void;
	onBack: () => void;
	searchQuery: string;
	onSearchQueryChange: (q: string) => void;
	searchPlaceholder: string;
	isLoading?: boolean;
}) {
	const filtered = React.useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return items;
		return items.filter((item) => item.toLowerCase().includes(q));
	}, [items, searchQuery]);

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/50">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded px-1.5 py-0.5 hover:bg-accent transition-colors"
				>
					<ChevronLeft className="size-3.5" />
					<span>Filter By</span>
				</button>
				<span className="text-xs font-medium text-foreground pr-1">{title}</span>
			</div>

			{items.length > 5 && (
				<div className="px-1 pb-1">
					<Input
						placeholder={searchPlaceholder}
						className="h-7 text-xs px-2"
						value={searchQuery}
						onChange={(e) => onSearchQueryChange(e.target.value)}
					/>
				</div>
			)}

			<div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
				{isLoading ? (
					<div className="py-4 text-center text-muted-foreground text-xs">
						Memuat data...
					</div>
				) : (
					<>
						<button
							type="button"
							onClick={() => onSelect("all")}
							className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent"
						>
							<span>Semua</span>
							<Check
								className={cn(
									"size-4 text-foreground transition-opacity",
									selectedValue === "all" ? "opacity-100" : "opacity-0",
								)}
							/>
						</button>
						{filtered.map((item) => {
							const isSelected = selectedValue === item;
							return (
								<button
									key={item}
									type="button"
									onClick={() => onSelect(isSelected ? "all" : item)}
									className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent"
								>
									<span>{item}</span>
									<Check
										className={cn(
											"size-4 text-foreground transition-opacity",
											isSelected ? "opacity-100" : "opacity-0",
										)}
									/>
								</button>
							);
						})}
						{filtered.length === 0 && (
							<div className="py-2 text-center text-muted-foreground text-xs">
								Tidak ada hasil
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export function BarangFilterPopover({
	filterCategory,
	onCategoryChange,
	filterBrand,
	onBrandChange,
	filterLocation,
	onLocationChange,
	className,
}: BarangFilterPopoverProps) {
	const [filterOpen, setFilterOpen] = React.useState(false);
	const [filterView, setFilterView] = React.useState<FilterView>("main");
	const [searchQuery, setSearchQuery] = React.useState("");

	const [categories, setCategories] = React.useState<string[]>([]);
	const [brands, setBrands] = React.useState<string[]>([]);
	const [locations, setLocations] = React.useState<string[]>([]);
	const [isLoadingOptions, setIsLoadingOptions] = React.useState(false);

	const activeFilterCount =
		(filterCategory !== "all" ? 1 : 0) +
		(filterBrand !== "all" ? 1 : 0) +
		(filterLocation !== "all" ? 1 : 0);

	React.useEffect(() => {
		let isMounted = true;
		setIsLoadingOptions(true);
		fetchAuxiliary()
			.then((data) => {
				if (!isMounted) return;
				setCategories(data.categories || []);
				setBrands(data.brands || []);
				setLocations((data.locations || []).map((l) => l.name));
			})
			.catch((err) => {
				console.error("Gagal memuat opsi filter material:", err);
			})
			.finally(() => {
				if (isMounted) setIsLoadingOptions(false);
			});

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<Popover
			open={filterOpen}
			onOpenChange={(open) => {
				setFilterOpen(open);
				if (!open) {
					setFilterView("main");
					setSearchQuery("");
				}
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-8 cursor-pointer gap-1.5 px-3 text-xs hover:text-foreground",
						activeFilterCount > 0 && "border-foreground/30 bg-accent font-medium",
						className,
					)}
				>
					<ListFilter className="size-3.5" />
					{activeFilterCount > 0 && (
						<Badge
							variant="quiet"
							className="h-4 min-w-4 rounded-full px-1 text-[10px] font-medium"
						>
							{activeFilterCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-56 p-2 text-xs"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{filterView === "main" && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between px-2.5 py-1">
							<span className="text-sm text-muted-foreground">Filter By</span>
						</div>

						<div className="flex flex-col gap-0.5">
							<MenuRow
								icon={Tag}
								label="Kategori"
								isActive={filterCategory !== "all"}
								onClick={() => {
									setSearchQuery("");
									setFilterView("category");
								}}
							/>
							<MenuRow
								icon={Bookmark}
								label="Merek"
								isActive={filterBrand !== "all"}
								onClick={() => {
									setSearchQuery("");
									setFilterView("brand");
								}}
							/>
							<MenuRow
								icon={MapPin}
								label="Lokasi / Shelf"
								isActive={filterLocation !== "all"}
								onClick={() => {
									setSearchQuery("");
									setFilterView("location");
								}}
							/>
						</div>

						{activeFilterCount > 0 && (
							<>
								<Separator className="-mx-2 my-1 w-auto data-horizontal:w-auto" />
								<button
									type="button"
									onClick={() => {
										onCategoryChange("all");
										onBrandChange("all");
										onLocationChange("all");
									}}
									className="flex w-full items-center justify-center rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
								>
									Reset filter
								</button>
							</>
						)}
					</div>
				)}

				{filterView === "category" && (
					<OptionSubView
						title="Kategori"
						items={categories}
						selectedValue={filterCategory}
						onSelect={onCategoryChange}
						onBack={() => setFilterView("main")}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						searchPlaceholder="Cari kategori..."
						isLoading={isLoadingOptions}
					/>
				)}

				{filterView === "brand" && (
					<OptionSubView
						title="Merek"
						items={brands}
						selectedValue={filterBrand}
						onSelect={onBrandChange}
						onBack={() => setFilterView("main")}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						searchPlaceholder="Cari merek..."
						isLoading={isLoadingOptions}
					/>
				)}

				{filterView === "location" && (
					<OptionSubView
						title="Lokasi"
						items={locations}
						selectedValue={filterLocation}
						onSelect={onLocationChange}
						onBack={() => setFilterView("main")}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						searchPlaceholder="Cari shelf..."
						isLoading={isLoadingOptions}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}

