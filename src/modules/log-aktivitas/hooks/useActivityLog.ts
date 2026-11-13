import { useCallback, useEffect, useRef, useState } from "react";
import { readCachedAutoPageSize } from "@/shared/ui/data-table/useAutoPageSize";
import { fetchLogs } from "../api/logApi";
import type { LogCounts, LogEntity, LogRange, LogStatusFilter, SystemEvent } from "../types";

const REFRESH_INTERVAL = 15_000;

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(value), delayMs);
		return () => window.clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
}

export function useActivityLog() {
	const [events, setEvents] = useState<SystemEvent[]>([]);
	const [totalItems, setTotalItems] = useState(0);
	const [counts, setCounts] = useState<LogCounts>({ success: 0, failed: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const [status, setStatus] = useState<LogStatusFilter>("all");
	const [entity, setEntity] = useState<LogEntity>("all");
	const [range, setRange] = useState<LogRange>("7d");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(() => readCachedAutoPageSize(10));

	const seqRef = useRef(0);
	const controllerRef = useRef<AbortController | null>(null);
	const didMountRef = useRef(false);
	const pendingPageResetRef = useRef(false);

	const request = useCallback(
		async (mode: "initial" | "silent") => {
			const seq = ++seqRef.current;
			controllerRef.current?.abort();
			const controller = new AbortController();
			controllerRef.current = controller;

			if (mode === "initial") setIsLoading(true);
			else setIsRefreshing(true);
			setError(null);

			try {
				const result = await fetchLogs(
					{
						page,
						limit: pageSize,
						search: debouncedSearch,
						status,
						entity,
						range,
					},
					controller.signal,
				);

				if (seq !== seqRef.current) return;
				setEvents(result.data);
				setTotalItems(result.pagination.totalItems);
				setCounts(result.counts);
				setLastUpdated(new Date());
			} catch (err) {
				if (controller.signal.aborted || seq !== seqRef.current) return;
				const message = err instanceof Error ? err.message : "Gagal memuat log aktivitas";
				if (mode === "initial") setError(message);
				else console.error("Gagal menyegarkan log aktivitas:", err);
			} finally {
				if (seq === seqRef.current) {
					setIsLoading(false);
					setIsRefreshing(false);
				}
			}
		},
		[page, pageSize, debouncedSearch, status, entity, range],
	);

	// Filter berubah → kembali ke halaman pertama tanpa sempat fetch halaman lama.
	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true;
			return;
		}
		pendingPageResetRef.current = true;
		setPage(1);
	}, [debouncedSearch, status, entity, range]);

	useEffect(() => {
		if (pendingPageResetRef.current) {
			pendingPageResetRef.current = false;
			if (page !== 1) return;
		}
		void request("initial");
	}, [request, page]);

	// Polling ringan hanya saat halaman pertama dan tab terlihat.
	useEffect(() => {
		if (page !== 1) return;

		const tick = () => {
			if (document.visibilityState === "visible") void request("silent");
		};
		const timer = window.setInterval(tick, REFRESH_INTERVAL);

		const onVisible = () => {
			if (document.visibilityState === "visible") void request("silent");
		};
		document.addEventListener("visibilitychange", onVisible);
		window.addEventListener("focus", onVisible);

		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
			window.removeEventListener("focus", onVisible);
			controllerRef.current?.abort();
		};
	}, [request, page]);

	return {
		events,
		totalItems,
		counts,
		isLoading,
		isRefreshing,
		error,
		lastUpdated,
		search,
		setSearch,
		status,
		setStatus,
		entity,
		setEntity,
		range,
		setRange,
		page,
		setPage,
		pageSize,
		setPageSize,
		refresh: () => request("silent"),
		reload: () => request("initial"),
	};
}
