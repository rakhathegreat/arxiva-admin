import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import type { DateRange } from "react-day-picker";
import { usePeminjamanMitra, type InterMitraTab } from "./hooks/usePeminjamanMitra";
import { RequestTable } from "./components/RequestTable";
import { RequestDetailDrawer } from "./components/RequestDetailDrawer";
import { RejectDialog } from "./components/RejectDialog";
import { RequestFilterPopover } from "@/modules/transaksi/components/RequestFilterPopover";
import type { InterMitraRequest } from "./types";

const TABS: InterMitraTab[] = [
	"Semua",
	"Menunggu",
	"Disetujui",
	"Serah",
	"Selesai",
	"Ditolak / Dibatalkan",
];

export default function PeminjamanMitraPage() {
	const {
		requests,
		isLoading,
		selected,
		setSelected,
		searchTerm,
		setSearchTerm,
		activeTab,
		setActiveTab,
		actionId,
		runAction,
		filtered,
	} = usePeminjamanMitra();

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

	const tabCounts = React.useMemo(() => {
		const match = (tab: InterMitraTab): number => {
			const norm = (s: string) => s.toUpperCase();
			switch (tab) {
				case "Semua":
					return requests.length;
				case "Menunggu":
					return requests.filter((r) => norm(r.status) === "MENUNGGU").length;
				case "Disetujui":
					return requests.filter((r) => norm(r.status) === "DISETUJUI").length;
				case "Serah":
					return requests.filter((r) => norm(r.status) === "SERAH").length;
				case "Selesai":
					return requests.filter((r) => norm(r.status) === "SELESAI").length;
				case "Ditolak / Dibatalkan":
					return requests.filter((r) =>
						["DITOLAK", "DIBATALKAN"].includes(norm(r.status)),
					).length;
				default:
					return 0;
			}
		};
		return Object.fromEntries(TABS.map((t) => [t, match(t)])) as Record<
			InterMitraTab,
			number
		>;
	}, [requests]);

	const [rejectTarget, setRejectTarget] = React.useState<InterMitraRequest | null>(null);
	const isBusy = actionId !== null;

	const categoryOptions = React.useMemo(
		() =>
			Array.from(
				new Set(
					requests
						.map((r) => r.partnerCategory)
						.filter((c): c is string => !!c),
				),
			).sort(),
		[requests],
	);

	const [filterCategories, setFilterCategories] = React.useState<string[]>([]);
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

	const displayed = React.useMemo(() => {
		let data = filtered;
		if (filterCategories.length > 0) {
			data = data.filter(
				(req) => req.partnerCategory && filterCategories.includes(req.partnerCategory),
			);
		}
		if (dateRange?.from || dateRange?.to) {
			data = data.filter((req) => {
				const reqDate = new Date(req.requestedAt).getTime();
				if (dateRange.from) {
					const startDate = new Date(dateRange.from).setHours(0, 0, 0, 0);
					if (reqDate < startDate) return false;
				}
				if (dateRange.to) {
					const endDate = new Date(dateRange.to).setHours(23, 59, 59, 999);
					if (reqDate > endDate) return false;
				}
				return true;
			});
		}
		return data;
	}, [filtered, filterCategories, dateRange]);

	const handleApprove = React.useCallback(
		(request: InterMitraRequest) => {
			runAction(request.id, "DISETUJUI");
		},
		[runAction],
	);

	const handleReject = React.useCallback(
		(notes: string | null) => {
			if (!rejectTarget) return;
			runAction(rejectTarget.id, "DITOLAK", notes);
			setRejectTarget(null);
		},
		[rejectTarget, runAction],
	);

	return (
		<div className="flex flex-col gap-5 p-4 md:p-6">
			<header className="flex flex-col gap-1">
				<h1 className="page-title">Peminjaman Antar Mitra</h1>
			</header>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as InterMitraTab)}
				className="w-full"
			>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center w-full overflow-x-auto pb-1">
						<TabsList className="inline-flex h-auto w-full lg:w-auto bg-accent/50 rounded-md">
							{TABS.map((tab) => {
								const count = tabCounts[tab] ?? 0;
								return (
									<TabsTrigger
										key={tab}
										value={tab}
										className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:text-accent-foreground"
									>
										{tab}
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
						data={displayed}
						isLoading={isLoading}
						actionId={actionId}
						onRowClick={setSelected}
						onApprove={handleApprove}
						onReject={setRejectTarget}
					/>
				</TabsContent>
			</Tabs>

			<RequestDetailDrawer
				request={selected}
				open={selected !== null}
				onClose={() => setSelected(null)}
				actionId={actionId}
				onApprove={handleApprove}
				onReject={setRejectTarget}
			/>

			<RejectDialog
				open={rejectTarget !== null}
				requestNumber={rejectTarget?.requestNumber || "-"}
				isBusy={isBusy}
				onOpenChange={(o) => !o && setRejectTarget(null)}
				onConfirm={handleReject}
			/>
		</div>
	);
}
