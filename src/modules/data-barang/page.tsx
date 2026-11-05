"use client";

import * as React from "react";
import { Plus, Search, Edit, Trash2, Boxes, Loader2, Download, ExternalLink } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Badge } from "@/shared/ui/badge";
import { DataTable, createRowActionsColumn } from "@/shared/ui/data-table/DataTable";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { BarangDetailDrawer } from "@/modules/data-barang/components/BarangDetailDrawer";
import { BarangFormModal } from "@/modules/data-barang/components/BarangFormModal";
import { ExportExcelModal } from "@/modules/data-barang/components/ExportExcelModal";
import { BarangFilterPopover } from "@/modules/data-barang/components/BarangFilterPopover";
import { formatItemLocation } from "@/shared/lib/status-helper";

import { useDataBarang } from "./hooks/useDataBarang";
import { STATUS_OPTIONS, formatTanggal, isReconTelat } from "./utils/barang";
import {
	ADMIN_LOCATION,
	searchBrands,
	searchCategories,
	searchLocations,
	searchModels,
} from "./api/barangApi";
import type { BarangUnit } from "@/shared/types/inventory";

export default function DataBarangPage() {
	const {
		barangList,
		isLoading,
		totalItems,
		currentPage,
		setCurrentPage,
		pageSize,
		setPageSize,
		searchTerm,
		setSearchTerm,
		filterStatus,
		setFilterStatus,
		filterCategory,
		setFilterCategory,
		filterBrand,
		setFilterBrand,
		filterLocation,
		setFilterLocation,
		isDetailOpen,
		setIsDetailOpen,
		detailBarang,
		isFormOpen,
		setIsFormOpen,
		isExportModalOpen,
		setIsExportModalOpen,
		isExporting,
		formMode,
		formData,
		setFormData,
		formErrors,
		isSaving,
		isDeleting,
		deleteDialog,
		setDeleteDialog,
		isFiltered,
		handleOpenDetail,
		handleOpenEdit,
		handleExportExcel,
		handleDelete,
		handleBulkDelete,
		confirmDelete,
		handleSubmitForm,
	} = useDataBarang();
	const navigate = useNavigate();

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

	const columns = React.useMemo<ColumnDef<BarangUnit, any>[]>(
		() => [
			{
				id: "nomor",
				header: "No.",
				cell: ({ row }) => (
					<div className="text-muted-foreground">
						{(currentPage - 1) * pageSize + row.index + 1}
					</div>
				),
			},
			{
				accessorKey: "serialNumber",
				header: "Serial Number (SN)",
			},
			{
				accessorKey: "merek",
				header: "Merek",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.merek || "-"}</span>
				),
			},
			{
				accessorKey: "kategori",
				header: "Kategori",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.kategori || "-"}</span>
				),
			},
			{
				accessorKey: "kondisi",
				header: "Kondisi",
				cell: ({ row }) => (
					<div className="flex justify-center">
						<StatusBadge size="sm" status={row.original.kondisi || "Baru"} />
					</div>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => (
					<div className="flex justify-center">
						<StatusBadge size="sm" status={row.original.status} />
					</div>
				),
			},
			{
				accessorKey: "lokasiPenyimpanan",
				header: "Lokasi Penyimpanan",
				cell: ({ row }) => (
					<span>
						{formatItemLocation(row.original.lokasiPenyimpanan, row.original.mitra)}
					</span>
				),
			},
			...(filterStatus === "Terdistribusi"
				? [
						{
							id: "lastReconDate",
							header: () => <span className="flex">Rekon Terakhir</span>,
							cell: ({ row }: { row: any }) => {
								const item: BarangUnit = row.original;
								const telat = isReconTelat(item);
								return (
									<div className="flex flex-col gap-1">
										<span
											className={
												item.lastReconDate ? "" : "text-muted-foreground"
											}
										>
											{item.lastReconDate
												? formatTanggal(item.lastReconDate)
												: "-"}
										</span>
										{item.lastPhotoUrl ? (
											<a
												href={item.lastPhotoUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-4 hover:text-primary/80"
											>
												<ExternalLink className="size-3" />
												Lihat Foto
											</a>
										) : null}
										{telat && (
											<Badge variant="glass" tone="orange" size="sm">
												Telat
											</Badge>
										)}
									</div>
								);
							},
						},
					]
				: []),
			createRowActionsColumn<BarangUnit>((item) => [
				{
					label: "Edit Material",
					icon: Edit,
					onClick: () => handleOpenEdit(item),
				},
				{
					label: "Hapus Material",
					icon: Trash2,
					destructive: true,
					onClick: () => handleDelete(item.id, item.serialNumber),
				},
			]),
		],
		[currentPage, pageSize, handleOpenEdit, handleDelete, filterStatus],
	);

	return (
		<div className="mx-auto flex h-full w-full flex-col gap-5 p-4 md:p-6">
			<header className="flex justify-between items-center gap-1">
				<h1 className="page-title">Data Material</h1>
				<Button
					size="sm"
					className="h-7 gap-1.5 text-xs rounded-md cursor-pointer transition-transform active:scale-98"
					onClick={() => navigate("/barang-masuk")}
				>
					<Plus className="size-3.5" /> Tambah Material
				</Button>
			</header>

			<Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center w-full overflow-x-auto pb-1">
						<TabsList className="inline-flex h-auto w-full lg:w-auto bg-accent/50 rounded-md">
							{STATUS_OPTIONS.map((status) => (
								<TabsTrigger
									key={status}
									value={status}
									className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:text-accent-foreground"
								>
									{status}
								</TabsTrigger>
							))}
						</TabsList>
					</div>

					<div className="flex flex-row items-center gap-2 w-full lg:w-auto">
						<div className="relative flex-1 lg:w-64">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								ref={searchInputRef}
								type="search"
								placeholder="Cari SN atau material..."
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

						<BarangFilterPopover
							filterCategory={filterCategory}
							onCategoryChange={setFilterCategory}
							filterBrand={filterBrand}
							onBrandChange={setFilterBrand}
							filterLocation={filterLocation}
							onLocationChange={setFilterLocation}
						/>

						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs rounded-md cursor-pointer hover:text-foreground"
							onClick={() => setIsExportModalOpen(true)}
						>
							<Download className="size-3.5" />
							<span>Export</span>
						</Button>
					</div>
				</div>
			</Tabs>

			<DataTable<BarangUnit>
				data={barangList}
				enableSelection
				getRowId={(row) => row.id}
				bulkActions={[
					{
						label: "Hapus terpilih",
						icon: Trash2,
						destructive: true,
						onAction: handleBulkDelete,
					},
				]}
				columns={columns}
				isLoading={isLoading}
				onRowClick={handleOpenDetail}
				pagination="server"
				totalItems={totalItems}
				page={currentPage}
				onPageChange={setCurrentPage}
				pageSize={pageSize}
				onPageSizeChange={setPageSize}
				className="flex flex-col gap-4 w-full min-h-0"
				emptyState={{
					icon: Boxes,
					title: "Belum ada data material",
					description: isFiltered
						? undefined
						: "Daftarkan unit material pertama ke dalam inventaris.",
					action: !isFiltered ? (
						<Button
							size="sm"
							className="gap-1.5 cursor-pointer"
							onClick={() => navigate("/barang-masuk")}
						>
							<Plus className="size-4" /> Tambah Material
						</Button>
					) : undefined,
				}}
			/>

			<BarangDetailDrawer
				isOpen={isDetailOpen}
				onOpenChange={setIsDetailOpen}
				detailBarang={detailBarang}
				userRole={"admin"}
				onOpenEdit={handleOpenEdit}
				formatTanggal={formatTanggal}
				ADMIN_LOCATION={ADMIN_LOCATION}
			/>

			<BarangFormModal
				isOpen={isFormOpen}
				onOpenChange={setIsFormOpen}
				formMode={formMode}
				formData={formData}
				setFormData={setFormData}
				formErrors={formErrors}
				isSaving={isSaving}
				onSubmit={handleSubmitForm}
				searchKategori={searchCategories}
				searchMerek={searchBrands}
				searchModel={searchModels}
				searchLokasi={searchLocations}
				STATUS_OPTIONS={STATUS_OPTIONS}
			/>

			<ExportExcelModal
				isOpen={isExportModalOpen}
				onOpenChange={setIsExportModalOpen}
				onExport={handleExportExcel}
				isExporting={isExporting}
			/>

			<AlertDialog
				open={!!deleteDialog}
				onOpenChange={(open) => !open && setDeleteDialog(null)}
			>
				<AlertDialogContent className="max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base text-destructive">
							{deleteDialog?.type === "single"
								? `Hapus Unit ${deleteDialog.serialNumber}`
								: `Hapus ${deleteDialog?.ids.length} Unit Terpilih?`}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-sm">
							Tindakan ini tidak dapat dibatalkan. Unit material yang dihapus akan
							terhapus dari sistem inventaris.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="pt-2">
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={isDeleting}
							variant="destructive"
						>
							{isDeleting ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								"Ya, Hapus Data"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
