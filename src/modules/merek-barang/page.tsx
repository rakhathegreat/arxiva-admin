"use client";

import * as React from "react";
import {
  Plus, Edit, Trash2, Search, CircleStar, MoreVertical, Loader2, LayoutGrid, List
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Kbd } from "@/shared/ui/kbd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/shared/ui/sheet";
import { Label } from "@/shared/ui/label";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { DataTable, createRowActionsColumn } from "@/shared/ui/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { Merek } from "@/shared/types/inventory";
import { useMerekBarang } from "./hooks/useMerekBarang";

export default function MerekBarangPage() {
	const {
		filteredBrands,
		searchQuery,
		setSearchQuery,
		viewMode,
		handleViewModeChange,
		isSheetOpen,
		setIsSheetOpen,
		handleOpenSheet,
		name,
		setName,
		identifier,
		setIdentifier,
		origin,
		setOrigin,
		formErrors,
		categories,
		categoryId,
		setCategoryId,
		isSaving,
		isDeleting,
		deleteAlertData,
		setDeleteAlertData,
		requestDelete,
		requestBulkDelete,
		confirmDelete,
		handleSave,
		editId,
		setFormErrors,
	} = useMerekBarang();

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
				if (searchQuery !== "") {
					e.preventDefault();
					setSearchQuery("");
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [searchQuery, setSearchQuery]);

	const columns = React.useMemo<ColumnDef<Merek, any>[]>(
		() => [
			{
				id: "nomor",
				header: () => <div className="text-center">No.</div>,
				cell: ({ row, table }) => {
					const { pageIndex, pageSize } = table.getState().pagination;
					return (
						<div className="text-center text-muted-foreground">
							{pageIndex * pageSize + row.index + 1}
						</div>
					);
				},
				meta: { className: "w-12 px-1 text-center" },
			},
			{
				accessorKey: "nama",
				header: "Nama Merek",
				cell: ({ row }) => <span className="text-foreground">{row.original.nama}</span>,
			},
			{
				accessorKey: "identifier",
				header: "Kode / Identifier",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.identifier || "-"}</span>
				),
			},
			{
				accessorKey: "origin",
				header: "Asal",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.origin || "-"}</span>
				),
			},
			{
				accessorKey: "totalItems",
				header: () => <span>Total Unit</span>,
				cell: ({ row }) => (
					<span className="text-foreground font-medium">{row.original.totalItems} Unit</span>
				),
			},
			createRowActionsColumn<Merek>([
				{ label: "Edit Merek", icon: Edit, onClick: (brand) => handleOpenSheet(brand.id) },
				{
					label: "Hapus Merek",
					icon: Trash2,
					destructive: true,
					onClick: (brand) => requestDelete(brand.id, brand.nama),
				},
			]),
		],
		[handleOpenSheet, requestDelete],
	);

	return (
    <div className="mx-auto flex h-full w-full flex-col gap-5 p-4 md:p-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Cari merek atau identifier..."
              className="w-full pl-9 pr-12 bg-card border-border placeholder:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setSearchQuery("");
                  searchInputRef.current?.blur();
                }
              }}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery !== "" ? (
                <Kbd
                  className="font-sans cursor-pointer select-none pointer-events-auto"
                  onClick={() => {
                    setSearchQuery("");
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
        </div>
        <div className="flex flex-1 justify-end items-center gap-2 w-full sm:w-auto">
          <div className="hidden sm:flex">
            <Tabs
              value={viewMode}
              onValueChange={(val) => handleViewModeChange(val as "grid" | "table")}
            >
              <TabsList className="inline-flex h-8 bg-accent/50 rounded-md p-0.5">
                <TabsTrigger
                  value="grid"
                  className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 h-7 px-2.5 text-xs transition-colors hover:text-accent-foreground"
                >
                  <LayoutGrid className="size-3.5" />
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 h-7 px-2.5 text-xs transition-colors hover:text-accent-foreground"
                >
                  <List className="size-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button className="h-8 gap-2 rounded-md" onClick={() => handleOpenSheet()}>
            <Plus className="w-4 h-4" /> Tambah Merek
          </Button>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="sm:hidden w-full">
        <Tabs
          value={viewMode}
          onValueChange={(val) => handleViewModeChange(val as "grid" | "table")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full h-9 bg-accent/50 rounded-md p-0.5">
            <TabsTrigger
              value="grid"
              className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 h-7.5 text-xs transition-colors hover:text-accent-foreground gap-1.5"
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="cursor-pointer rounded-md dark:data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-accent/50 h-7.5 text-xs transition-colors hover:text-accent-foreground gap-1.5"
            >
              <List className="size-3.5" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
          {filteredBrands.map(brand => (
            <Card key={brand.id} className="overflow-hidden relative group transition-all duration-300 hover:border-border/80 hover:bg-muted/60">
              <CardContent className="px-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="shrink-0 rounded-md bg-foreground/5 p-2.5">
                    <CircleStar className="h-6 w-6 text-foreground" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                      <DropdownMenuItem className="cursor-pointer focus:bg-accent" onClick={() => handleOpenSheet(brand.id)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Merek
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => requestDelete(brand.id, brand.nama)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus Merek
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <h3 className="mb-1 text-[15px] font-medium text-foreground">{brand.nama}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{brand.identifier}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-border/60 flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Total Material</span>
                  <span className="text-sm font-medium text-foreground">{brand.totalItems} Unit</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredBrands.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="size-10 bg-muted rounded-md flex items-center justify-center mb-4">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground">
                {searchQuery ? "Merek Tidak Ditemukan" : "Belum Ada Data"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery
                  ? "Coba gunakan kata kunci lain atau tambahkan merek baru."
                  : "Daftarkan merek material pertama untuk mulai mengelompokkan unit."}
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5 cursor-pointer rounded-md"
                onClick={() => handleOpenSheet()}
              >
                <Plus className="size-4" /> Tambah Merek
              </Button>
            </div>
          )}
        </div>
      ) : (
        <DataTable<Merek>
          data={filteredBrands}
          enableSelection
          getRowId={(row) => row.id}
          bulkActions={[
          	{
          		label: "Hapus terpilih",
          		icon: Trash2,
          		destructive: true,
          		onAction: (ids) =>
          			requestBulkDelete(
          				ids.flatMap((id) => {
          					const row = filteredBrands.find((x) => String(x.id) === id);
          					return row ? [{ id: String(row.id), name: row.nama }] : [];
          				}),
          			),
          	},
          ]}
          columns={columns}
          emptyState={{
            icon: Search,
            title: searchQuery ? "Merek Tidak Ditemukan" : "Belum Ada Data",
            description: searchQuery
              ? "Coba gunakan kata kunci lain atau tambahkan merek baru."
              : "Daftarkan merek material pertama untuk mulai mengelompokkan unit.",
            action: (
              <Button size="sm" className="gap-1.5 cursor-pointer rounded-md" onClick={() => handleOpenSheet()}>
                <Plus className="size-4" /> Tambah Merek
              </Button>
            ),
          }}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md border-border bg-card p-0 flex flex-col text-foreground">
          <SheetHeader className="p-6 border-b border-border/60 bg-muted/20">
            <SheetTitle>{editId ? "Edit Merek" : "Tambah Merek Baru"}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Isi formulir di bawah ini untuk mengelola informasi merek material.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label>Nama Merek</Label>
                <Input
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setFormErrors(current => ({ ...current, name: "" }))
                  }}
                  placeholder="Contoh: Cisco"
                  className={`bg-card ${formErrors.name ? "border-destructive" : "border-border"}`}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Identifier</Label>
                <Input
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value.toUpperCase())
                    setFormErrors(current => ({ ...current, identifier: "" }))
                  }}
                  placeholder="Contoh: CIS"
                  className={`bg-card font-mono uppercase ${formErrors.identifier ? "border-destructive" : "border-border"}`}
                />
                {formErrors.identifier && (
                  <p className="text-xs text-destructive">{formErrors.identifier}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value)
                    setFormErrors(current => ({ ...current, category: "" }))
                  }}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asal</Label>
                <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Contoh: Amerika Serikat" className="bg-card border-border" />
              </div>
            </div>
          </div>
          <SheetFooter className="p-6 border-t border-border/60 bg-muted/20 flex sm:justify-end gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="hover:bg-muted text-foreground" disabled={isSaving}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Perubahan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteAlertData.isOpen} onOpenChange={(open) => !open && !isDeleting && setDeleteAlertData({ ...deleteAlertData, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
	);
}
