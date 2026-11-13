import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLogs } from "../api/logApi";
import type { SystemEvent } from "../types";

const REFRESH_INTERVAL = 15_000;

/**
 * Log terbaru untuk widget dashboard. Tidak memakai filter/pagination tabel;
 * cukup halaman pertama dari rentang 7 hari dan diperbarui berkala.
 */
export function useRecentLogs(limit = 6, enabled = true) {
	const [events, setEvents] = useState<SystemEvent[]>([]);
	const [isLoading, setIsLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);

	const seqRef = useRef(0);
	const controllerRef = useRef<AbortController | null>(null);

	const load = useCallback(
		async (silent = false) => {
			if (!enabled) return;

			const seq = ++seqRef.current;
			controllerRef.current?.abort();
			const controller = new AbortController();
			controllerRef.current = controller;

			if (!silent) {
				setIsLoading(true);
				setError(null);
			}

			try {
				const result = await fetchLogs(
					{
						page: 1,
						limit,
						search: "",
						status: "all",
						entity: "all",
						range: "7d",
					},
					controller.signal,
				);

				if (seq !== seqRef.current) return;
				setEvents(result.data);
				setError(null);
			} catch (err) {
				if (controller.signal.aborted || seq !== seqRef.current) return;
				const message = err instanceof Error ? err.message : "Gagal memuat log aktivitas";
				if (silent) console.error("Gagal menyegarkan log dashboard:", err);
				else setError(message);
			} finally {
				if (seq === seqRef.current) setIsLoading(false);
			}
		},
		[enabled, limit],
	);

	useEffect(() => {
		if (!enabled) {
			setEvents([]);
			setError(null);
			setIsLoading(false);
			return;
		}

		void load();

		const tick = () => {
			if (document.visibilityState === "visible") void load(true);
		};
		const timer = window.setInterval(tick, REFRESH_INTERVAL);

		const onVisible = () => {
			if (document.visibilityState === "visible") void load(true);
		};
		document.addEventListener("visibilitychange", onVisible);
		window.addEventListener("focus", onVisible);

		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
			window.removeEventListener("focus", onVisible);
			controllerRef.current?.abort();
		};
	}, [enabled, load]);

	return { events, isLoading, error };
}
