import { memo } from "react";

import {
	Archive,
	ArchiveX,
	ArrowsUpFromLine,
	Boxes,
	HelpCircle,
	TrendingUp,
	TrendingDown,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

import type { InventoryStats } from "@/modules/dashboard/types";

type CardKey = "total" | "tersedia" | "diluar" | "rusak" | "hilang";

const CARD_DEFS: {
	key: CardKey;
	label: string;
	valueKey: keyof InventoryStats;
	icon: typeof Boxes;
	direction: "up" | "down";
	percent: number;
}[] = [
	{
		key: "total",
		label: "Total Material",
		valueKey: "totalItems",
		icon: Boxes,
		direction: "up",
		percent: 12.5,
	},
	{
		key: "tersedia",
		label: "Tersedia",
		valueKey: "tersedia",
		icon: Archive,
		direction: "up",
		percent: 8.2,
	},
	{
		key: "diluar",
		label: "Diluar",
		valueKey: "diluar",
		icon: ArrowsUpFromLine,
		direction: "down",
		percent: 4.1,
	},
	{
		key: "rusak",
		label: "Rusak",
		valueKey: "rusak",
		icon: ArchiveX,
		direction: "down",
		percent: 1.2,
	},
	{
		key: "hilang",
		label: "Hilang",
		valueKey: "hilang",
		icon: HelpCircle,
		direction: "down",
		percent: 0.5,
	},
] as const;

function SectionCardsBase({
	stats,
	totalLabel = "Total Material",
}: {
	stats: InventoryStats;
	totalLabel?: string;
}) {
	const cards = CARD_DEFS.map((def) => {
		const Icon = def.icon;
		return {
			key: def.key,
			label: def.key === "total" ? totalLabel : def.label,
			value: stats[def.valueKey],
			icon: Icon,
			direction: def.direction,
			percent: def.percent,
		};
	});

	return (
		<div className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
			{cards.map(({ key, label, value, icon: Icon, direction, percent }) => {
				return (
					<Card key={key} className="@container/card justify-between gap-0 py-0">
						<CardHeader className="flex flex-col gap-1 py-4">
							<div className="flex w-full items-start justify-between gap-2">
								<CardDescription className="pr-2 text-muted-foreground">
									{label}
								</CardDescription>
								<Icon className="size-4 shrink-0 text-muted-foreground" />
							</div>
							<CardTitle className="text-lg leading-none font-[450] tracking-tight tabular-nums @[250px]/card:text-[32px]">
								{value}
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-3">
							<div
								className={`flex items-center gap-1.5 text-xs ${
									direction === "up" ? "text-success" : "text-muted-foreground"
								}`}
							>
								{direction === "up" ? (
									<TrendingUp className="size-3.5 shrink-0" />
								) : (
									<TrendingDown className="size-3.5 shrink-0" />
								)}
								<span className="font-mono tracking-[0.04em]">
									{direction === "up" ? "+" : "-"}
									{percent}%
								</span>
								<span className="text-xs font-normal text-muted-foreground">
									dari bulan lalu
								</span>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export const SectionCards = memo(SectionCardsBase);
