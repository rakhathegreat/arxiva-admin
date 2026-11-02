"use client";

import { useBarangMasukLogic } from "@/modules/barang-masuk/hooks/useBarangMasukLogic";
import { InboundFormCard } from "@/modules/barang-masuk/components/InboundFormCard";
import { ScannedItemsTable } from "@/modules/barang-masuk/components/ScannedItemsTable";

/**
 * Komponen BarangMasukPage
 * 
 * Modul operasional Gudang untuk mencatat penerimaan barang masuk.
 * Menangani pembuatan inventaris baru (untuk Admin/KP) dan 
 * penerimaan distribusi (untuk Mitra) dengan deteksi cerdas merek & lokasi rak.
 */
export default function BarangMasukPage() {
  const logic = useBarangMasukLogic();

  return (
    <div className="flex min-h-[calc(100svh-4rem)] select-none flex-col gap-4 py-4 md:gap-5 md:py-5">
      <div className="flex h-full flex-1 flex-col gap-4 px-4 lg:px-6">
        <InboundFormCard
          asalBarang={logic.asalBarang}
          setAsalBarang={logic.setAsalBarang}
          asalBarangManual={logic.asalBarangManual}
          setAsalBarangManual={logic.setAsalBarangManual}
          dbPartners={logic.dbPartners}
          kodeBarang={logic.kodeBarang}
          updateKodeBarang={logic.updateKodeBarang}
          inputRef={logic.inputRef}
          kodeBarangRef={logic.kodeBarangRef}
          handleSubmit={logic.handleSubmit}
          itemCondition={logic.itemCondition}
          setItemCondition={logic.setItemCondition}
          nomorPA={logic.nomorPA}
          setNomorPA={logic.setNomorPA}
          ticket={logic.ticket}
          setTicket={logic.setTicket}
          tipeBarang={logic.tipeBarang}
          setTipeBarang={logic.setTipeBarang}
          brand={logic.brand}
          setBrand={logic.setBrand}
          kategori={logic.kategori}
          setKategori={logic.setKategori}
          dbBrands={logic.dbBrands}
          dbCategories={logic.dbCategories}
          catatan={logic.catatan}
          setCatatan={logic.setCatatan}
          focusKodeBarangInput={logic.focusKodeBarangInput}
        />

        <ScannedItemsTable
          barangMasuk={logic.session.barangMasuk}
          dbBrands={logic.dbBrands}
          dbCategories={logic.dbCategories}
          dbModels={logic.dbModels}
          dbLocations={logic.dbLocations}
          kuota={logic.session.kuota}
          asalBarang={logic.asalBarang}
          isSaving={logic.isSaving}
          handleUpdateInline={logic.session.updateInline}
          handleUpdateLokasi={logic.session.updateLokasi}
          handleDeleteItem={logic.session.deleteItem}
          handleValidateAll={logic.handleValidateAll}
          focusKodeBarangInput={logic.focusKodeBarangInput}
        />
      </div>
    </div>
  );
}
