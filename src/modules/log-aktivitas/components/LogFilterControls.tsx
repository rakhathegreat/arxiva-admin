import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { LogEntity, LogRange, LogStatusFilter } from "../types";
import { ENTITY_OPTIONS, RANGE_OPTIONS } from "../utils/log";

interface LogFilterControlsProps {
	search: string;
	onSearchChange: (value: string) => void;
	searchInputRef: React.RefObject<HTMLInputElement>;
	status: LogStatusFilter;
	onStatusChange: (value: LogStatusFilter) => void;
	entity: LogEntity;
	onEntityChange: (value: LogEntity) => void;
	range: LogRange;
	onRangeChange: (value: LogRange) => void;
}

export function LogFilterControls({
	search,
	onSearchChange,
	searchInputRef,
	status,
	onStatusChange,
	entity,
	onEntityChange,
	range,
	onRangeChange,
}: LogFilterControlsProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div className="relative w-full lg:max-w-sm">
				<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					ref={searchInputRef}
					type="search"
					value={search}
					placeholder="Cari aktor, ringkasan, atau SN..."
					className="pr-16 pl-9 text-sm"
					onChange={(event) => onSearchChange(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							event.preventDefault();
							onSearchChange("");
							searchInputRef.current?.blur();
						}
					}}
				/>
				<div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1">
					{search !== "" ? (
						<Kbd
							className="pointer-events-auto cursor-pointer font-sans select-none"
							title="Tekan Esc untuk hapus pencarian"
							onClick={() => {
								onSearchChange("");
								searchInputRef.current?.blur();
							}}
						>
							Esc
						</Kbd>
					) : (
						<Kbd title="Tekan / untuk mencari">/</Kbd>
					)}
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2 lg:ml-auto">
				<Tabs
					value={status}
					onValueChange={(value) => onStatusChange(value as LogStatusFilter)}
				>
					<TabsList className="h-8">
						<TabsTrigger value="all" className="cursor-pointer px-2.5 text-xs">
							Semua
						</TabsTrigger>
						<TabsTrigger value="SUCCESS" className="cursor-pointer px-2.5 text-xs">
							Berhasil
						</TabsTrigger>
						<TabsTrigger value="FAILED" className="cursor-pointer px-2.5 text-xs">
							Gagal
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Select
					value={entity}
					onValueChange={(value) => onEntityChange(value as LogEntity)}
				>
					<SelectTrigger size="sm" className="w-[148px] cursor-pointer text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{ENTITY_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value} className="text-xs">
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={range} onValueChange={(value) => onRangeChange(value as LogRange)}>
					<SelectTrigger size="sm" className="w-[156px] cursor-pointer text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{RANGE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value} className="text-xs">
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
