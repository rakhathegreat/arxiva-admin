import { useEffect, useState } from "react";
import { fetchMaterialStats, type MaterialStats } from "../utils/materialStats";

/** Ringkasan isi gudang untuk halaman Lokasi Material. */
export function useMaterialStats() {
	const [data, setData] = useState<MaterialStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setIsLoading(true);
		setError(null);
		try {
			setData(await fetchMaterialStats());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Gagal memuat ringkasan material.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return { data, isLoading, error, reload: load };
}

export type { MaterialStats };
