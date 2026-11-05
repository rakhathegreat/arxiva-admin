import * as React from "react";
import {
	ArrowDownAZ,
	BadgeCheck,
	BookUser,
	Calendar,
	Check,
	ListFilter,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";

export const ROLE_TABS = [
	{ key: "all", label: "Semua" },
	{ key: "ADMIN", label: "Admin" },
	{ key: "INTERNAL", label: "Internal" },
	{ key: "MITRA", label: "Mitra" },
] as const;

export type RoleTabKey = (typeof ROLE_TABS)[number]["key"];

export const STATUS_FILTERS = [
	{ key: "all", label: "Semua status" },
	{ key: "active", label: "Aktif" },
	{ key: "inactive", label: "Nonaktif" },
] as const;

export type StatusKey = (typeof STATUS_FILTERS)[number]["key"];

export type SortKey = "default" | "name-asc" | "name-desc" | "date-desc" | "date-asc";

const SORT_NAME_OPTIONS = [
	{ key: "name-asc", label: "A ke Z" },
	{ key: "name-desc", label: "Z ke A" },
] as const;

const SORT_DATE_OPTIONS = [
	{ key: "date-desc", label: "Terbaru" },
	{ key: "date-asc", label: "Terlama" },
] as const;

type FilterView = "main" | "role" | "status" | "sort-name" | "sort-date";

interface UserFilterPopoverProps {
	roleTab: RoleTabKey;
	onRoleTabChange: (role: RoleTabKey) => void;
	statusFilter: StatusKey;
	onStatusFilterChange: (status: StatusKey) => void;
	sortBy: SortKey;
	onSortByChange: (sort: SortKey) => void;
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

function OptionList<T extends string>({
	options,
	selectedValue,
	onSelect,
}: {
	options: readonly { key: T; label: string }[];
	selectedValue: T;
	onSelect: (key: T) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-col gap-0.5 pt-0.5">
				{options.map(({ key, label }) => {
					const isSelected = selectedValue === key;
					return (
						<button
							key={key}
							type="button"
							onClick={() => onSelect(key)}
							className={cn(
								"flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer hover:bg-accent",
							)}
						>
							<div className="flex w-full items-center justify-between">
								<span>{label === "Semua status" ? "Semua" : label}</span>
								<Check
									className={cn(
										"size-4.5 text-foreground transition-opacity",
										isSelected ? "opacity-100" : "opacity-0",
									)}
								/>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function UserFilterPopover({
	roleTab,
	onRoleTabChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	onSortByChange,
	className,
}: UserFilterPopoverProps) {
	const [filterOpen, setFilterOpen] = React.useState(false);
	const [filterView, setFilterView] = React.useState<FilterView>("main");

	const activeFilterCount =
		(roleTab !== "all" ? 1 : 0) +
		(statusFilter !== "all" ? 1 : 0) +
		(sortBy !== "default" ? 1 : 0);

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
								icon={BookUser}
								label="Role"
								isActive={roleTab !== "all"}
								onClick={() => setFilterView("role")}
							/>
							<MenuRow
								icon={BadgeCheck}
								label="Status"
								isActive={statusFilter !== "all"}
								onClick={() => setFilterView("status")}
							/>
						</div>

						<Separator className="-mx-2 my-1 w-auto data-horizontal:w-auto" />

						<div className="flex items-center justify-between px-2.5 py-1">
							<span className="text-sm text-muted-foreground">Sort By</span>
						</div>

						<div className="flex flex-col gap-0.5">
							<MenuRow
								icon={ArrowDownAZ}
								label="Nama"
								isActive={sortBy === "name-asc" || sortBy === "name-desc"}
								onClick={() => setFilterView("sort-name")}
							/>
							<MenuRow
								icon={Calendar}
								label="Tanggal"
								isActive={sortBy === "date-desc" || sortBy === "date-asc"}
								onClick={() => setFilterView("sort-date")}
							/>
						</div>
					</div>
				)}

				{filterView === "role" && (
					<OptionList
						options={ROLE_TABS}
						selectedValue={roleTab}
						onSelect={onRoleTabChange}
					/>
				)}

				{filterView === "status" && (
					<OptionList
						options={STATUS_FILTERS}
						selectedValue={statusFilter}
						onSelect={onStatusFilterChange}
					/>
				)}

				{filterView === "sort-name" && (
					<OptionList
						options={SORT_NAME_OPTIONS}
						selectedValue={sortBy}
						onSelect={(key) =>
							onSortByChange(sortBy === key ? "default" : (key as SortKey))
						}
					/>
				)}

				{filterView === "sort-date" && (
					<OptionList
						options={SORT_DATE_OPTIONS}
						selectedValue={sortBy}
						onSelect={(key) =>
							onSortByChange(sortBy === key ? "default" : (key as SortKey))
						}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}

