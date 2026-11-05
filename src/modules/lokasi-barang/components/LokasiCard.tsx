import {
	ArrowRightLeft,
	ArrowUpRight,
	Edit,
	MoreVertical,
	Plus,
	Power,
	QrCode,
	Trash2,
} from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Level, StorageLocation } from "@/shared/types/inventory";
import type { SheetMode } from "@/shared/types/ui";
import { cn } from "@/shared/lib/utils";
import { CapacityBar } from "./CapacityBar";
import { getTypeConfig } from "./type-config";

export interface LokasiCardActions {
	onOpenSheet: (mode: SheetMode, item?: { parentId?: string; levelId?: string }) => void;
	onToggleLocation: (id: string) => void;
	onToggleLevel: (rakId: string, levelId: string) => void;
	onDeleteLocation: (id: string, name: string) => void;
	onDeleteLevel: (levelId: string, name: string) => void;
	onDownloadQr: (url: string | null | undefined, name: string) => void;
	/** Buka Data Material terfilter untuk lokasi ini. */
	onViewItems: (query: string) => void;
	/** Pindahkan seluruh item dari lokasi ini ke lokasi lain. */
	onMigrate: (sourceId: string, sourceLabel: string, itemCount: number) => void;
}

interface LokasiCardProps extends LokasiCardActions {
	loc: StorageLocation;
	isToggling: boolean;
	isDeleting: boolean;
}

const MENU_ITEM = "cursor-pointer text-xs";
const MENU_ITEM_DANGER = "cursor-pointer text-xs text-destructive focus:text-destructive";

function BrandRule({ rule }: { rule?: string | null }) {
	if (!rule) return null;
	return (
		<span className="max-w-32 truncate rounded-sm bg-muted px-1.5 py-px text-[10px] leading-4 text-muted-foreground">
			{rule}
		</span>
	);
}

function CardMenu({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={label}
					className="shrink-0 cursor-pointer text-muted-foreground opacity-60 transition-opacity duration-150 group-hover/card:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100">
					<MoreVertical className="size-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Kartu lokasi penyimpanan. Rak menampilkan level; kardus/pallet ringkas. */
export function LokasiCard({
	loc,
	isToggling,
	isDeleting,
	onOpenSheet,
	onToggleLocation,
	onToggleLevel,
	onDeleteLocation,
	onDeleteLevel,
	onDownloadQr,
	onViewItems,
	onMigrate,
}: LokasiCardProps) {
	const { icon: Icon, editMode } = getTypeConfig(loc.type);
	const inactive = !loc.isActive;

	const header = (
		<div className="flex items-start gap-2.5 p-3.5">
			<Icon aria-hidden className="mt-px size-3.5 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="truncate text-sm font-medium text-foreground">{loc.name}</span>
					{inactive && (
						<Badge variant="quiet" className="h-4 shrink-0 px-1.5 text-[10px]">
							Nonaktif
						</Badge>
					)}
				</div>
				<p className="mt-0.5 text-[11px] text-muted-foreground">
					{loc.type === "Rak"
						? `${loc.levels?.length ?? 0} level penyimpanan`
						: `Penyimpanan ${loc.type.toLowerCase()}`}
				</p>
			</div>
			<CardMenu label={`Menu ${loc.name}`}>
				<DropdownMenuGroup>
					{loc.type === "Rak" ? (
						<>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onOpenSheet("edit-rak", { parentId: loc.id })}>
								<Edit /> Edit nama rak
							</DropdownMenuItem>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onOpenSheet("add-level", { parentId: loc.id })}>
								<Plus /> Tambah level
							</DropdownMenuItem>
						</>
					) : (
						<>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onOpenSheet(editMode, { parentId: loc.id })}>
								<Edit /> Edit {loc.type.toLowerCase()}
							</DropdownMenuItem>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onDownloadQr(loc.sheetUrl, loc.name)}>
								<QrCode /> Unduh QR code
							</DropdownMenuItem>
							<DropdownMenuItem
								className={MENU_ITEM}
								disabled={!loc.usedCapacity}
								onClick={() => onMigrate(loc.id, loc.name, loc.usedCapacity || 0)}>
								<ArrowRightLeft /> Pindahkan isi
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						disabled={isToggling}
						className={MENU_ITEM}
						onClick={() => onToggleLocation(loc.id)}>
						<Power /> {loc.isActive ? `Nonaktifkan ${loc.type.toLowerCase()}` : `Aktifkan ${loc.type.toLowerCase()}`}
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={isDeleting}
						className={MENU_ITEM_DANGER}
						onClick={() => onDeleteLocation(loc.id, loc.name)}>
						<Trash2 /> Hapus {loc.type.toLowerCase()}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</CardMenu>
		</div>
	);

	function LevelRow({ lvl }: { lvl: Level }) {
		const query = `${loc.name} - ${lvl.name}`;
		const levelInactive = inactive || !lvl.isActive;

		return (
			<li className="flex items-center gap-1.5 pr-2 pl-3.5 transition-colors duration-150 hover:bg-muted/40">
				<button
					type="button"
					onClick={() => onViewItems(query)}
					className="min-w-0 flex-1 cursor-pointer py-2.5 pr-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30">
					<span className="flex min-w-0 items-center gap-1.5">
						<span
							className={cn(
								"truncate text-xs",
								levelInactive ? "text-muted-foreground" : "text-foreground",
							)}>
							{lvl.name}
						</span>
						<BrandRule rule={lvl.brandRule} />
						{levelInactive && (
							<span className="shrink-0 text-[10px] text-muted-foreground">nonaktif</span>
						)}
					</span>
					<CapacityBar used={lvl.usedCapacity} capacity={lvl.capacity} className="mt-1.5" />
				</button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-xs"
							aria-label={`Menu ${lvl.name}`}
							className="shrink-0 cursor-pointer text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100">
							<MoreVertical className="size-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuGroup>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onOpenSheet("edit-level", { parentId: loc.id, levelId: lvl.id })}>
								<Edit /> Edit level
							</DropdownMenuItem>
							<DropdownMenuItem
								className={MENU_ITEM}
								onClick={() => onDownloadQr(lvl.sheetUrl, query)}>
								<QrCode /> Unduh QR code
							</DropdownMenuItem>
							<DropdownMenuItem
								className={MENU_ITEM}
								disabled={!lvl.usedCapacity}
								onClick={() => onMigrate(lvl.id, query, lvl.usedCapacity)}>
								<ArrowRightLeft /> Pindahkan isi
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								disabled={inactive || isToggling}
								className={MENU_ITEM}
								onClick={() => onToggleLevel(loc.id, lvl.id)}>
								<Power /> {lvl.isActive ? "Nonaktifkan level" : "Aktifkan level"}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={isDeleting}
								className={MENU_ITEM_DANGER}
								onClick={() => onDeleteLevel(lvl.id, lvl.name)}>
								<Trash2 /> Hapus level
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</li>
		);
	}

	if (loc.type !== "Rak") {
		return (
			<Card
				className={cn(
					"group/card gap-0 py-0",
					inactive && "bg-muted/40",
				)}>
				{header}
				<div className="flex flex-col gap-2.5 border-t border-border px-3.5 py-3">
					<CapacityBar used={loc.usedCapacity || 0} capacity={loc.capacity || 0} />
					<div className="flex items-center justify-between gap-2">
						<BrandRule rule={loc.brandRule} />
						<Button
							variant="ghost"
							size="xs"
							onClick={() => onViewItems(loc.name)}
							className="-mr-1.5 h-6 cursor-pointer gap-1 px-1.5 text-[11px] font-normal text-muted-foreground hover:text-foreground">
							Lihat material <ArrowUpRight className="size-3" />
						</Button>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className={cn("group/card gap-0 py-0", inactive && "bg-muted/40")}>
			{header}
			{loc.levels && loc.levels.length > 0 ? (
				<ul className="divide-y divide-border border-t border-border">
					{loc.levels.map((lvl) => (
						<LevelRow key={lvl.id} lvl={lvl} />
					))}
				</ul>
			) : (
				<div className="flex flex-col items-start gap-1 border-t border-border px-3.5 py-3">
					<p className="text-[11px] text-muted-foreground">Rak ini belum memiliki level.</p>
					<Button
						variant="ghost"
						size="xs"
						onClick={() => onOpenSheet("add-level", { parentId: loc.id })}
						className="-ml-1.5 h-6 cursor-pointer gap-1 px-1.5 text-[11px] font-normal">
						<Plus className="size-3" /> Tambah level
					</Button>
				</div>
			)}
		</Card>
	);
}
