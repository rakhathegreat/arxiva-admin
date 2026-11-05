import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import { useSearchParams } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { RequestTable } from "@/modules/transaksi/components/request-table";
import { RequestDetailDrawer } from "@/modules/transaksi/components/request-detail-drawer";
import { RequestFilterPopover } from "@/modules/transaksi/components/RequestFilterPopover";
import { useRequests, type RequestTab } from "@/modules/transaksi/hooks/useRequests";

/** Trigger yang benar-benar tampil di tab bar (urutan = urutan tampil). */
const NAV_TABS: RequestTab[] = ["Menunggu", "Disetujui", "Serah", "Siap", "Selesai", "Ditolak"];

const FALLBACK_HIDDEN_COLUMNS = ["catatan"];

/**
 * Map statis (referensi objek permanen) agar prop `hiddenColumns` stabil dan
 * tidak membatalkan memoisasi `RequestTable` pada setiap re-render halaman.
 */
const HIDDEN_COLUMNS_BY_TAB: Record<RequestTab, string[]> = {
	Menunggu: ["catatan", "document"],
	Disetujui: ["catatan", "actions"],
	Serah: ["catatan", "actions"],
	Siap: ["catatan"],
	Diterima: ["catatan", "actions"],
	Selesai: ["catatan", "actions"],
	Ditolak: ["actions", "document"],
};

const COUNT_MODE_BY_TAB: Record<RequestTab, "requested" | "allocated"> = {
	Menunggu: "requested",
	Disetujui: "requested",
	Serah: "requested",
	Siap: "allocated",
	Diterima: "allocated",
	Selesai: "allocated",
	Ditolak: "requested",
};

function getHiddenColumns(tab: string): string[] {
	return HIDDEN_COLUMNS_BY_TAB[tab as RequestTab] ?? FALLBACK_HIDDEN_COLUMNS;
}

function getCountMode(tab: string): "requested" | "allocated" {
	return COUNT_MODE_BY_TAB[tab as RequestTab] ?? "requested";
}

export default function DataTransaksiPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") || "Menunggu";

	const handleTabChange = (value: string) => {
		setSearchParams(
			(prev) => {
				prev.set("tab", value);
				return prev;
			},
			{ replace: true },
		);
	};

	const {
		searchTerm,
		setSearchTerm,
		selectedRequest,
		setSelectedRequest,
		filterCategories,
		setFilterCategories,
		dateRange,
		setDateRange,
		categoryOptions,
		counts,
		activeTabData,
		fetchRequests,
		handleStatusChange,
	} = useRequests(activeTab as RequestTab);

	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// Keyboard shortcuts: "/" to focus search, "Escape" to clear search
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

			if (e.key === "Escape" && !isInputActive) {
				if (searchTerm !== "") {
					e.preventDefault();
					setSearchTerm("");
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [searchTerm, setSearchTerm]);

	return (
		<div className="flex flex-col gap-5 p-4 md:p-6">
			<header className="flex flex-col gap-1">
				<h1 className="page-title">Request Material</h1>
			</header>

			<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center w-full overflow-x-auto pb-1">
						<TabsList className="inline-flex h-auto w-full lg:w-auto bg-accent/50 rounded-md">
							{NAV_TABS.map((tab) => {
								const count = counts[tab] ?? 0;
								return (
									<TabsTrigger
										key={tab}
										value={tab}
										className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:text-accent-foreground"
									>
										{tab === "Ditolak" ? "Ditolak / Batal" : tab}
										{count > 0 && <Badge variant="quiet">{count}</Badge>}
									</TabsTrigger>
								);
							})}
						</TabsList>
					</div>

					<div className="flex flex-row items-center gap-2 w-full lg:w-auto">
						<div className="relative flex-1 lg:w-64">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								ref={searchInputRef}
								type="search"
								placeholder="Cari transaksi..."
								className="pl-9 pr-16 text-sm"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										e.preventDefault();
										setSearchTerm("");
										searchInputRef.current?.blur();
									}
								}}
							/>
							<div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
								{searchTerm !== "" ? (
									<Kbd
										className="font-sans cursor-pointer select-none pointer-events-auto"
										onClick={() => {
											setSearchTerm("");
											searchInputRef.current?.blur();
										}}
										title="Tekan Esc untuk hapus pencarian"
									>
										Esc
									</Kbd>
								) : (
									<Kbd title="Tekan / untuk mencari">/</Kbd>
								)}
							</div>
						</div>

						<RequestFilterPopover
							categories={categoryOptions}
							selectedCategories={filterCategories}
							onSelectedCategoriesChange={setFilterCategories}
							dateRange={dateRange}
							onDateRangeChange={setDateRange}
						/>
					</div>
				</div>

				<TabsContent value={activeTab} className="mt-0 flex flex-col gap-4 min-h-0">
					<RequestTable
						data={activeTabData}
						onRowClick={setSelectedRequest}
						onStatusChange={handleStatusChange}
						onRefetch={fetchRequests}
						hiddenColumns={getHiddenColumns(activeTab)}
						countMode={getCountMode(activeTab)}
					/>
				</TabsContent>
			</Tabs>

			{/* Request Detail Drawer */}
			<RequestDetailDrawer
				item={selectedRequest}
				open={selectedRequest !== null}
				onClose={() => setSelectedRequest(null)}
				onStatusChange={handleStatusChange}
			/>
		</div>
	);
}
