import type { DashboardSummary } from "@/modules/dashboard/types";
import { getBaseUrl, getHeaders } from "@/shared/lib/api";

export const DashboardService = {
    /** Ambil seluruh agregat dashboard dalam SATU panggilan ringan. */
    async fetchSummary(signal?: AbortSignal): Promise<DashboardSummary> {
        const res = await fetch(`${getBaseUrl()}/dashboard/stats/summary`, {
            method: "GET",
            headers: getHeaders(),
            signal,
        });
        if (!res.ok) {
            throw new Error(`Dashboard summary request failed (${res.status})`);
        }
        const raw = await res.json();
        return raw.data || raw;
    },
};