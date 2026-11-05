import { fetchItems, type ItemsQuery } from "@/modules/data-barang/api/barangApi";

export interface DistributionSlice {
	name: string;
	jumlah: number;
}

export interface MaterialStats {
	total: number;
	statusCounts: DistributionSlice[];
	kategoriTop: DistributionSlice[];
	merekTop: DistributionSlice[];
}

const TOP_N = 6;

/** Ambil N terbesar; sisanya digabung jadi satu irisan "Lainnya". */
export function toSlices(map: Map<string, number>, topN = TOP_N): DistributionSlice[] {
	if (map.size === 0) return [];
	const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
	const top = sorted.slice(0, topN).map(([name, jumlah]) => ({ name, jumlah }));
	const rest = sorted.slice(topN).reduce((a, [, n]) => a + n, 0);
	return rest > 0 ? [...top, { name: "Lainnya", jumlah: rest }] : top;
}

/**
 * Ringkasan material gudang KP: total unit, sebaran status, serta kategori
 * dan merek terbanyak. Agregasi dilakukan di klien dari satu tarikan daftar.
 */
export async function fetchMaterialStats(): Promise<MaterialStats> {
	const query: ItemsQuery = {
		page: 1,
		pageSize: 10000,
		searchTerm: "",
		filterStatus: "all",
		filterCategory: "all",
		filterBrand: "all",
		filterLocation: "all",
	};
	const json = await fetchItems(query);
	const items = Array.isArray(json?.data) ? json.data : [];

	const statusMap = new Map<string, number>();
	const kategoriMap = new Map<string, number>();
	const merekMap = new Map<string, number>();

	for (const item of items) {
		const status = item.status?.trim();
		if (status) statusMap.set(status, (statusMap.get(status) || 0) + 1);
		const kategori = item.kategori?.trim();
		if (kategori) kategoriMap.set(kategori, (kategoriMap.get(kategori) || 0) + 1);
		const merek = item.merek?.trim();
		if (merek) merekMap.set(merek, (merekMap.get(merek) || 0) + 1);
	}

	return {
		total: json?.pagination?.totalItems ?? items.length,
		statusCounts: [...statusMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([name, jumlah]) => ({ name, jumlah })),
		kategoriTop: toSlices(kategoriMap),
		merekTop: toSlices(merekMap),
	};
}
