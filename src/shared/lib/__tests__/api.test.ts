import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, apiFetch, APIError, getBaseUrl, getHeaders, PRODUCTION_API_URL } from "../api";

const store = new Map<string, string>();

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

beforeEach(() => {
	store.clear();
	vi.stubGlobal("localStorage", {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
		clear: () => store.clear(),
	});
	vi.stubEnv("URL", "http://localhost:3000/");
	vi.stubEnv("VITE_URL", "");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("getBaseUrl", () => {
	it("memakai URL dan memangkas trailing slash", () => {
		expect(getBaseUrl()).toBe("http://localhost:3000");
	});

	it("mengabaikan VITE_URL — hanya URL yang dibaca", () => {
		vi.stubEnv("VITE_URL", "https://vite-url.example");
		expect(getBaseUrl()).toBe("http://localhost:3000");
	});

	it("jatuh ke backend produksi bila URL kosong", () => {
		vi.stubEnv("URL", "");
		expect(getBaseUrl()).toBe(PRODUCTION_API_URL);
	});

	it("memangkas semua trailing slash", () => {
		vi.stubEnv("URL", "https://api.example.com///");
		expect(getBaseUrl()).toBe("https://api.example.com");
	});

	it("jatuh ke backend produksi bila URL menunjuk ke host kode (bukan API)", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubEnv("URL", "https://github.com/rakhathegreat/arxiva-admin");
		expect(getBaseUrl()).toBe(PRODUCTION_API_URL);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("jatuh ke backend produksi bila URL bukan URL absolut", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubEnv("URL", "/api");
		expect(getBaseUrl()).toBe(PRODUCTION_API_URL);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("jatuh ke backend produksi bila skemanya bukan http(s)", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubEnv("URL", "ftp://api.example.com");
		expect(getBaseUrl()).toBe(PRODUCTION_API_URL);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("tetap memakai URL valid lain (mis. staging)", () => {
		vi.stubEnv("URL", "https://staging.example.com/");
		expect(getBaseUrl()).toBe("https://staging.example.com");
	});
});

describe("getHeaders", () => {
	it("hanya memuat Content-Type tanpa token", () => {
		expect(getHeaders()).toEqual({ "Content-Type": "application/json" });
	});

	it("menambahkan Authorization token mentah (tanpa prefix Bearer)", () => {
		store.set("arxiva-auth-token", "jwt-abc");
		expect(getHeaders()).toEqual({
			"Content-Type": "application/json",
			Authorization: "jwt-abc",
		});
	});
});

describe("apiFetch", () => {
	it("mengembalikan body JSON apa adanya", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({ ok: true, token: "t1" })),
		);
		const body = await apiFetch<{ ok: boolean; token: string }>(
			"http://localhost:3000/auth/login",
			{
				method: "POST",
			},
		);
		expect(body).toEqual({ ok: true, token: "t1" });
	});

	it("tidak memberi prefix base URL pada URL absolut", async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);
		await apiFetch("http://other-host/x");
		expect(fetchMock).toHaveBeenCalledWith("http://other-host/x", expect.any(Object));
	});

	it("melempar APIError bertipe saat respons tidak ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({ message: "Nope" }, 403)),
		);
		await expect(apiFetch("http://localhost:3000/x")).rejects.toBeInstanceOf(APIError);
		await expect(apiFetch("http://localhost:3000/x")).rejects.toMatchObject({
			message: "Nope",
			response: { status: 403 },
		});
	});

	it("mengembalikan Blob untuk respons application/pdf", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(new Blob(["%PDF-1.4"]), {
						status: 200,
						headers: { "content-type": "application/pdf" },
					}),
			),
		);
		const data = await apiFetch("http://localhost:3000/requests/1/pdf");
		expect(data).toBeInstanceOf(Blob);
	});
});

describe("api helper", () => {
	it("api.get memberi prefix base URL dan menyertakan header", async () => {
		store.set("arxiva-auth-token", "jwt-abc");
		const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
		vi.stubGlobal("fetch", fetchMock);

		const result = await api.get("/items");

		expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/items", {
			method: "GET",
			headers: expect.objectContaining({ Authorization: "jwt-abc" }),
		});
		expect(result).toMatchObject({ status: 200, data: { data: [] } });
	});

	it("api.post men-stringify body", async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await api.post("/items", { serialNumber: "SN-1" });

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:3000/items",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ serialNumber: "SN-1" }),
			}),
		);
	});
});
