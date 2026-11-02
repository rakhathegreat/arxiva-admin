import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { api } from "@/shared/lib/api";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import type { DashboardRequest } from "@/modules/transaksi/types";

/** Status yang terpapar sebagai tab (urutan = urutan tab). */
export const REQUEST_TABS = [
  "Menunggu",
  "Disetujui",
  "Serah",
  "Siap",
  "Diterima",
  "Selesai",
  "Ditolak",
] as const;

export type RequestTab = (typeof REQUEST_TABS)[number];

/** Status "aktif" (antrian) disort FIFO; sisanya LIFO. */
const ACTIVE_TABS = new Set(["menunggu", "siap"]);

const normalizeStatus = (value?: string | null) =>
  (value || "").trim().toUpperCase();

const isRejectedTab = (tab: string) => tab.toLowerCase() === "ditolak";

const matchesTab = (req: DashboardRequest, tab: string) => {
  const status = normalizeStatus(req.status);
  if (isRejectedTab(tab)) {
    return status === "DITOLAK" || status === "DIBATALKAN";
  }
  return status === normalizeStatus(tab);
};

const sortByRequestedAt = (
  rows: DashboardRequest[],
  fifo: boolean,
  timestamps: Map<string, number>,
) =>
  [...rows].sort((a, b) => {
    const timeA = timestamps.get(a.id) ?? 0;
    const timeB = timestamps.get(b.id) ?? 0;
    return fifo ? timeA - timeB : timeB - timeA;
  });

export function useRequests(activeTab: RequestTab = "Menunggu") {
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<DashboardRequest | null>(null);

  // State lokal popover filter (hanya diterapkan saat "Terapkan").
  const [tempFilterCategories, setTempFilterCategories] = useState<string[]>([]);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [, startTransition] = useTransition();

  const handleApplyFilter = useCallback(() => {
    setIsFilterOpen(false);
    startTransition(() => {
      setFilterCategories(tempFilterCategories);
      setDateRange(tempDateRange);
    });
  }, [tempFilterCategories, tempDateRange]);

  const handleResetFilter = useCallback(() => {
    setIsFilterOpen(false);
    startTransition(() => {
      setTempFilterCategories([]);
      setTempDateRange(undefined);
      setFilterCategories([]);
      setDateRange(undefined);
    });
  }, []);

  const handleOpenFilter = useCallback((open: boolean) => {
    setIsFilterOpen(open);
    if (open) {
      setTempFilterCategories(filterCategories);
      setTempDateRange(dateRange);
    }
  }, [filterCategories, dateRange]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get("/requests");
      const data: DashboardRequest[] = res.data;
      setRequests(data);
    } catch (error) {
      console.error("Gagal mengambil data permintaan:", error);
      toast.error("Gagal memuat data permintaan.");
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: string, rejectionNotes?: string) => {
      const status = normalizeStatus(newStatus);
      try {
        await api.put(`/requests/${id}/status`, {
          status,
          rejectionNotes: rejectionNotes || null,
        });
        setRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? { ...req, status, rejectionNotes: rejectionNotes || undefined }
              : req,
          ),
        );
        toast.success(`Status transaksi berhasil diubah menjadi ${newStatus}`);
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Gagal mengubah status transaksi";
        toast.error(msg);
      }
    },
    [],
  );

  // Nilai unik partnerCategory sebagai opsi filter.
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const req of requests) {
      if (req.partnerCategory) seen.add(req.partnerCategory);
    }
    return Array.from(seen).sort();
  }, [requests]);

  // Hitung jumlah per status dalam satu pass.
  const counts = useMemo(() => {
    const result: Partial<Record<RequestTab, number>> = {};
    for (const tab of REQUEST_TABS) {
      result[tab] = 0;
    }
    for (const req of requests) {
      const status = normalizeStatus(req.status);
      if (status === "DITOLAK" || status === "DIBATALKAN") {
        result.Ditolak = (result.Ditolak ?? 0) + 1;
      }
      const tab =
        REQUEST_TABS.find((t) => normalizeStatus(t) === status) ?? null;
      if (tab) result[tab] = (result[tab] ?? 0) + 1;
    }
    return result;
  }, [requests]);

  // Pencarian diturunkan prioritasnya (deferred) agar ketikan tidak memblokir render.
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Cache timestamp per request (parse tanggal sekali saja) untuk sort cepat.
  const timestamps = useMemo(() => {
    const map = new Map<string, number>();
    for (const req of requests) {
      map.set(req.id, new Date(req.requestedAt).getTime());
    }
    return map;
  }, [requests]);

  const filteredData = useMemo(() => {
    let data = requests;

    if (filterCategories.length > 0) {
      data = data.filter(
        (req) =>
          req.partnerCategory && filterCategories.includes(req.partnerCategory),
      );
    }

    if (dateRange?.from || dateRange?.to) {
      data = data.filter((req) => {
        const reqDate = timestamps.get(req.id) ?? 0;
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

    if (deferredSearchTerm.trim()) {
      const lowerSearch = deferredSearchTerm.toLowerCase();
      data = data.filter(
        (req) =>
          req.requestNumber?.toLowerCase().includes(lowerSearch) ||
          req.requesterName?.toLowerCase().includes(lowerSearch) ||
          req.notes?.toLowerCase().includes(lowerSearch) ||
          req.partnerCategory?.toLowerCase().includes(lowerSearch),
      );
    }

    return data;
  }, [requests, filterCategories, dateRange, deferredSearchTerm, timestamps]);

  // Data untuk tab aktif saja — sesuai keputusan "render hanya tab aktif".
  const activeTabData = useMemo(() => {
    const rows = filteredData.filter((req) => matchesTab(req, activeTab));
    return sortByRequestedAt(rows, ACTIVE_TABS.has(activeTab.toLowerCase()), timestamps);
  }, [filteredData, activeTab, timestamps]);

  return {
    requests,
    searchTerm,
    setSearchTerm,
    filterCategories,
    setFilterCategories,
    dateRange,
    setDateRange,
    selectedRequest,
    setSelectedRequest,
    tempFilterCategories,
    setTempFilterCategories,
    tempDateRange,
    setTempDateRange,
    isFilterOpen,
    setIsFilterOpen,
    handleApplyFilter,
    handleResetFilter,
    handleOpenFilter,
    categoryOptions,
    counts,
    activeTabData,
    fetchRequests,
    handleStatusChange,
  };
}