import { getBaseUrl, getHeaders } from "@/shared/lib/api";

export interface ManagedUser {
	id: string;
	username: string;
	role: "ADMIN" | "INTERNAL" | "MITRA";
	isAktif: boolean;
	createdAt: string;
	updatedAt: string;
	profile: {
		nama: string | null;
		email: string | null;
		telepon: string | null;
		alamat: string | null;
		code: string | null;
		partnerType: string | null;
		contactPerson: string | null;
	} | null;
}

export interface UserPayload {
	username: string;
	password?: string;
	role: ManagedUser["role"];
	isAktif?: boolean;
	nama: string;
	email: string;
	telepon: string;
	alamat?: string;
	code?: string;
	partnerType?: string;
}

async function unwrap<T>(res: Response, fallbackMessage: string): Promise<T> {
	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error((e as { message?: string }).message || fallbackMessage);
	}
	return res.json() as Promise<T>;
}

export async function fetchUsers(): Promise<ManagedUser[]> {
	const json = await unwrap<ManagedUser[] | { data?: ManagedUser[] }>(
		await fetch(`${getBaseUrl()}/users`, { method: "GET", headers: getHeaders() }),
		"Gagal mengambil daftar user",
	);
	return (Array.isArray(json) ? json : json.data) || [];
}

export async function createUser(payload: UserPayload): Promise<ManagedUser> {
	const json = await unwrap<{ user?: ManagedUser }>(
		await fetch(`${getBaseUrl()}/users`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(payload),
		}),
		"Gagal menambahkan user",
	);
	return json.user as ManagedUser;
}

export async function updateUser(id: string, payload: Partial<UserPayload>): Promise<void> {
	await unwrap(
		await fetch(`${getBaseUrl()}/users/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify(payload),
		}),
		"Gagal memperbarui user",
	);
}

export async function deleteUser(id: string): Promise<void> {
	await unwrap(
		await fetch(`${getBaseUrl()}/users/${id}`, { method: "DELETE", headers: getHeaders() }),
		"Gagal menghapus user",
	);
}
