import { getBaseUrl, getHeaders } from "@/shared/lib/api";
import type { LogListResponse, LogQuery } from "../types";

export async function fetchLogs(query: LogQuery, signal?: AbortSignal): Promise<LogListResponse> {
	const params = new URLSearchParams({
		page: String(query.page),
		limit: String(query.limit),
		status: query.status,
		entity: query.entity,
		range: query.range,
	});

	const search = query.search.trim();
	if (search) params.set("search", search);

	const res = await fetch(`${getBaseUrl()}/logs?${params.toString()}`, {
		method: "GET",
		headers: getHeaders(),
		signal,
	});

	if (!res.ok) {
		let message = `Gagal memuat log aktivitas (${res.status})`;
		try {
			const body = await res.json();
			if (typeof body?.message === "string" && body.message.trim()) message = body.message;
		} catch {
			// Non-JSON error body: keep the status message.
		}
		throw new Error(message);
	}

	return (await res.json()) as LogListResponse;
}
