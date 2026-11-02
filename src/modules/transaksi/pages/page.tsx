import { Search, ListFilter } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { useSearchParams } from "react-router-dom"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Badge } from "@/shared/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Checkbox } from "@/shared/ui/checkbox"
import { Calendar } from "@/shared/ui/calendar"
import { Separator } from "@/shared/ui/separator"
import { RequestTable } from "@/modules/transaksi/components/request-table"
import { RequestDetailDrawer } from "@/modules/transaksi/components/request-detail-drawer"
import { useRequests, type RequestTab } from "@/modules/transaksi/hooks/useRequests"
import { cn } from "@/shared/lib/utils"

/** Trigger yang benar-benar tampil di tab bar (urutan = urutan tampil). */
const NAV_TABS: RequestTab[] = [
  "Menunggu",
  "Disetujui",
  "Serah",
  "Siap",
  "Selesai",
  "Ditolak",
]

const FALLBACK_HIDDEN_COLUMNS = ["catatan"]

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
}

const COUNT_MODE_BY_TAB: Record<RequestTab, "requested" | "allocated"> = {
  Menunggu: "requested",
  Disetujui: "requested",
  Serah: "requested",
  Siap: "allocated",
  Diterima: "allocated",
  Selesai: "allocated",
  Ditolak: "requested",
}

function getHiddenColumns(tab: string): string[] {
  return HIDDEN_COLUMNS_BY_TAB[tab as RequestTab] ?? FALLBACK_HIDDEN_COLUMNS
}

function getCountMode(tab: string): "requested" | "allocated" {
  return COUNT_MODE_BY_TAB[tab as RequestTab] ?? "requested"
}

export default function DataTransaksiPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "Menunggu"

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set("tab", value)
      return prev
    }, { replace: true })
  }

  const {
    searchTerm,
    setSearchTerm,
    selectedRequest,
    setSelectedRequest,
    filterCategories,
    dateRange,
    tempFilterCategories,
    setTempFilterCategories,
    tempDateRange,
    setTempDateRange,
    isFilterOpen,
    handleApplyFilter,
    handleResetFilter,
    handleOpenFilter,
    categoryOptions,
    counts,
    activeTabData,
    fetchRequests,
    handleStatusChange,
  } = useRequests(activeTab as RequestTab)

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow text-stone">Operasional</p>
        <h1 className="page-title">Request Material</h1>
        <p className="text-sm text-muted-foreground">
          Kelola permintaan material dari mitra dan status pengambilannya.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center w-full overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto w-full lg:w-auto">
              {NAV_TABS.map((tab) => {
                const count = counts[tab] ?? 0
                return (
                  <TabsTrigger key={tab} value={tab} className="cursor-pointer">
                    {tab === "Ditolak" ? "Ditolak / Batal" : tab}
                    {count > 0 && <Badge variant="secondary">{count}</Badge>}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={handleOpenFilter}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "shrink-0 gap-1.5 px-3 cursor-pointer",
                    (filterCategories.length > 0 || dateRange?.from || dateRange?.to) &&
                      "border-foreground/30 bg-foreground/[0.04] text-foreground",
                  )}
                >
                  <ListFilter className="size-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {(filterCategories.length > 0 || dateRange?.from || dateRange?.to) && (
                    <Badge variant="secondary" className="ml-1">
                      {(filterCategories.length > 0 ? 1 : 0) +
                        (dateRange?.from || dateRange?.to ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-auto p-4"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm leading-none text-muted-foreground">
                      Kategori Partner
                    </h4>
                    <div className="flex flex-col gap-3">
                      {categoryOptions.map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat}`}
                            checked={tempFilterCategories.includes(cat)}
                            onCheckedChange={(checked) => {
                              setTempFilterCategories((prev) =>
                                checked
                                  ? [...prev, cat]
                                  : prev.filter((c) => c !== cat),
                              )
                            }}
                          />
                          <label
                            htmlFor={`cat-${cat}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm leading-none text-muted-foreground">
                      Rentang Tanggal
                    </h4>
                    <div className="border rounded-md">
                      <Calendar
                        mode="range"
                        defaultMonth={tempDateRange?.from}
                        selected={tempDateRange}
                        onSelect={setTempDateRange}
                        numberOfMonths={1}
                        className="p-3"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilter}
                      className="cursor-pointer"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyFilter}
                      className="cursor-pointer"
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
  )
}