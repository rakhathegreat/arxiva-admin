/**
 * Klien API tunggal untuk admin.
 *
 * Menggabungkan `shared/lib/api.ts` (objek `api`, APIError bertipe, sadar
 * non-JSON) dan `shared/lib/api.client.ts` (`apiFetch`). Semua modul harus
 * mengimpor helper dari sini — jangan menyalin `getBaseUrl`/`getHeaders` lagi.
 */

/** Backend produksi. Dipakai kalau `URL` tidak diset sama sekali. */
export const PRODUCTION_API_URL = "https://api-taslim.duckdns.org";

/** Host yang jelas bukan backend API — pernah terpasang karena env salah isi. */
const BUKAN_API = ["github.com", "www.github.com", "gitlab.com", "bitbucket.org"];

/**
 * Normalisasi + validasi base URL.
 *
 * Sengaja melempar Error, bukan diam-diam memakai nilai lain: base URL yang
 * salah membuat semua request dikirim ke host asing dan tampil di browser
 * sebagai error CORS yang menyesatkan ("No Access-Control-Allow-Origin"),
 * padahal masalahnya ada di konfigurasi build. `URL` adalah nama yang sangat
 * umum, jadi nilai yang salah isi tetap harus gagal dengan pesan jelas.
 */
function normalizeBaseUrl(raw: string): string {
	let parsed: globalThis.URL;
	try {
		parsed = new globalThis.URL(raw);
	} catch {
		throw new Error(
			`URL bukan URL absolut: "${raw}". Set ke ${PRODUCTION_API_URL} (tanpa trailing slash).`,
		);
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new Error(`URL harus memakai http/https, bukan "${parsed.protocol}".`);
	}
	if (BUKAN_API.includes(parsed.hostname)) {
		throw new Error(
			`URL menunjuk ke ${parsed.hostname}, bukan backend API. Isi dengan ${PRODUCTION_API_URL}.`,
		);
	}
	return raw.replace(/\/+$/, "");
}

export const getBaseUrl = () => {
	// Satu variabel saja: `URL`.
	const raw = (import.meta.env.URL ?? "").trim();
	if (!raw) return PRODUCTION_API_URL;
	return normalizeBaseUrl(raw);
};

export const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers["Authorization"] = `${token}`;
	}

	return headers;
};

/** Error bertipe yang membawa status + body agar pemanggil bisa membedakan 4xx/5xx. */
export class APIError extends Error {
	response: any;

	constructor(message: string, response: any) {
		super(message);
		this.name = "APIError";
		this.response = response;
	}
}

/**
 * Fetch satu URL absolut: parse json/pdf/text sesuai `content-type`, dan
 * melempar `APIError` bila respons tidak ok.
 */
async function fetchParsed(url: string, options: RequestInit = {}) {
	const config = {
		...options,
		headers: {
			...getHeaders(),
			...options.headers,
		},
	};

	const response = await fetch(url, config);

	let data;
	const contentType = response.headers.get("content-type");

	if (contentType && contentType.includes("application/json")) {
		data = await response.json();
	} else if (contentType && contentType.includes("application/pdf")) {
		data = await response.blob();
	} else {
		data = await response.text();
	}

	if (!response.ok) {
		throw new APIError(data?.message || "API request failed", {
			status: response.status,
			data,
		});
	}

	return { data, status: response.status, headers: response.headers };
}

/**
 * Kembalikan body saja. Menerima URL absolut (tidak di-prefix `getBaseUrl()`),
 * menjaga kompatibilitas dengan pemanggil `apiFetch` lama.
 */
export async function apiFetch<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
	const { data } = await fetchParsed(typeof input === "string" ? input : input.toString(), init);
	return data as T;
}

const request = (endpoint: string, options: RequestInit = {}) =>
	fetchParsed(`${getBaseUrl()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, options);

export const api = {
	get: (endpoint: string, options?: RequestInit) =>
		request(endpoint, { method: "GET", ...options }),
	post: (endpoint: string, data?: any, options?: RequestInit) =>
		request(endpoint, {
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
			...options,
		}),
	put: (endpoint: string, data?: any, options?: RequestInit) =>
		request(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
			...options,
		}),
	delete: (endpoint: string, options?: RequestInit) =>
		request(endpoint, { method: "DELETE", ...options }),
};
