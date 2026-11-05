import * as React from "react";
import {
	Calendar as CalendarIcon,
	Check,
	ChevronRight,
	ListFilter,
	Tag,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";

type FilterView = "main" | "category" | "date" | "calendar";

interface RequestFilterPopoverProps {
	categories: string[];
	selectedCategories: string[];
	onSelectedCategoriesChange: (categories: string[]) => void;
	dateRange: DateRange | undefined;
	onDateRangeChange: (range: DateRange | undefined) => void;
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

const DATE_PRESETS = [
	{
		key: "all",
		label: "Semua waktu",
		getRange: () => undefined,
	},
	{
		key: "today",
		label: "Hari ini",
		getRange: (): DateRange => {
			const now = new Date();
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
			const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			return { from: start, to: end };
		},
	},
	{
		key: "7days",
		label: "7 hari terakhir",
		getRange: (): DateRange => {
			const end = new Date();
			const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
			return { from: start, to: end };
		},
	},
	{
		key: "30days",
		label: "30 hari terakhir",
		getRange: (): DateRange => {
			const end = new Date();
			const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
			return { from: start, to: end };
		},
	},
	{
		key: "thisMonth",
		label: "Bulan ini",
		getRange: (): DateRange => {
			const now = new Date();
			const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
			return { from: start, to: end };
		},
	},
] as const;

export function RequestFilterPopover({
	categories,
	selectedCategories,
	onSelectedCategoriesChange,
	dateRange,
	onDateRangeChange,
	className,
}: RequestFilterPopoverProps) {
	const [filterOpen, setFilterOpen] = React.useState(false);
	const [filterView, setFilterView] = React.useState<FilterView>("main");

	const activeFilterCount =
		(selectedCategories.length > 0 ? 1 : 0) + (dateRange?.from || dateRange?.to ? 1 : 0);

	const [selectedDatePreset, setSelectedDatePreset] = React.useState<string>(() => {
		if (!dateRange?.from && !dateRange?.to) return "all";
		return "calendar";
	});

	React.useEffect(() => {
		if (!dateRange?.from && !dateRange?.to) {
			setSelectedDatePreset("all");
		}
	}, [dateRange?.from, dateRange?.to]);

	const handleCategoryToggle = (category: string) => {
		if (selectedCategories.includes(category)) {
			onSelectedCategoriesChange(selectedCategories.filter((c) => c !== category));
		} else {
			onSelectedCategoriesChange([...selectedCategories, category]);
		}
	};

	return (
		<Popover
			open={filterOpen}
			onOpenChange={(open) => {
				setFilterOpen(open);
				if (!open) setFilterView("main");
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-8 cursor-pointer gap-1.5 px-3 text-xs hover:text-foreground",
						activeFilterCount > 0 && "border-foreground/30 bg-accent",
						className,
					)}
				>
					<ListFilter className="size-3.5" />
					{activeFilterCount > 0 && (
						<Badge variant="quiet" className="h-4 min-w-4 rounded-full px-1 text-xs">
							{activeFilterCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className={cn(filterView === "calendar" ? "w-auto" : "w-46", "p-2 text-xs")}
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
								isActive={selectedCategories.length > 0}
								onClick={() => setFilterView("category")}
							/>
							<MenuRow
								icon={CalendarIcon}
								label="Tanggal"
								isActive={Boolean(dateRange?.from || dateRange?.to)}
								onClick={() => setFilterView("date")}
							/>
						</div>
					</div>
				)}

				{filterView === "category" && (
					<div className="flex flex-col gap-1">
						<div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
							<button
								type="button"
								onClick={() => onSelectedCategoriesChange([])}
								className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent"
							>
								<span>Semua</span>
								<Check
									className={cn(
										"size-4 text-foreground transition-opacity",
										selectedCategories.length === 0
											? "opacity-100"
											: "opacity-0",
									)}
								/>
							</button>
							{categories.map((cat) => {
								const isSelected = selectedCategories.includes(cat);
								return (
									<button
										key={cat}
										type="button"
										onClick={() => handleCategoryToggle(cat)}
										className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent"
									>
										<span className="capitalize">{cat.toLowerCase()}</span>
										<Check
											className={cn(
												"size-4 text-foreground transition-opacity",
												isSelected ? "opacity-100" : "opacity-0",
											)}
										/>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{filterView === "date" && (
					<div className="flex flex-col gap-1">
						<div className="flex flex-col gap-0.5">
							{DATE_PRESETS.map((preset) => {
								const isSelected = selectedDatePreset === preset.key;

								return (
									<button
										key={preset.key}
										type="button"
										onClick={() => {
											setSelectedDatePreset(preset.key);
											onDateRangeChange(preset.getRange());
										}}
										className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent"
									>
										<span>{preset.label}</span>
										<Check
											className={cn(
												"size-4 text-foreground transition-opacity",
												isSelected ? "opacity-100" : "opacity-0",
											)}
										/>
									</button>
								);
							})}

							<Separator className="-mx-2 my-1 w-auto data-horizontal:w-auto" />

							<button
								type="button"
								onClick={() => setFilterView("calendar")}
								className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent text-foreground"
							>
								<span>Pilih Kalender...</span>
								<div className="flex items-center gap-1">
									<Check
										className={cn(
											"size-4 text-foreground transition-opacity",
											selectedDatePreset === "calendar" &&
												Boolean(dateRange?.from || dateRange?.to)
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									<ChevronRight className="size-3.5 text-muted-foreground" />
								</div>
							</button>
						</div>
					</div>
				)}

				{filterView === "calendar" && (
					<div className="flex flex-col gap-1">
						<div className="p-1">
							<Calendar
								mode="range"
								defaultMonth={dateRange?.from}
								selected={dateRange}
								onSelect={(range) => {
									setSelectedDatePreset("calendar");
									onDateRangeChange(range);
								}}
								numberOfMonths={1}
								className="p-1"
							/>
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
