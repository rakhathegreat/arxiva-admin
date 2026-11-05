import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/auth";
import {
	createUser,
	deleteUser,
	fetchUsers,
	updateUser,
	type ManagedUser,
	type UserPayload,
} from "../api/userApi";

/** Kredensial plaintext yang baru dibuat/direset — hanya ada di memori untuk modal receipt. */
export interface SuccessCredential {
	nama: string;
	username: string;
	role: string;
	password: string;
}

export function useManajemenUser() {
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState<ManagedUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successCredential, setSuccessCredential] = useState<SuccessCredential | null>(null);

	const load = async (options?: { silent?: boolean }) => {
		if (!options?.silent) {
			setIsLoading(true);
		}
		setError(null);
		try {
			setUsers(await fetchUsers());
		} catch (e: any) {
			if (!options?.silent) {
				setError(e.message || "Gagal memuat daftar user.");
			}
		} finally {
			if (!options?.silent) {
				setIsLoading(false);
			}
		}
	};

	useEffect(() => {
		load();
	}, []);

	const handleCreate = async (payload: UserPayload) => {
		await createUser(payload);
		setSuccessCredential({
			nama: payload.nama || payload.username,
			username: payload.username,
			role: payload.role,
			password: payload.password || "",
		});
		toast.success("User baru berhasil ditambahkan");
		await load({ silent: true });
	};

	const handleUpdate = async (id: string, payload: Partial<UserPayload>) => {
		await updateUser(id, payload);
		toast.success("Perubahan berhasil disimpan");
		await load({ silent: true });
	};

	const handleResetPassword = async (user: ManagedUser, password: string) => {
		await updateUser(user.id, { password });
		setSuccessCredential({
			nama: user.profile?.nama || user.username,
			username: user.username,
			role: user.role,
			password,
		});
		toast.success("Password berhasil direset");
	};

	const runSequential = async (
		targets: ManagedUser[],
		run: (u: ManagedUser) => Promise<void>,
		labelOk: string,
	) => {
		let ok = 0;
		let fail = 0;
		for (const u of targets) {
			try {
				await run(u);
				ok++;
			} catch {
				fail++;
			}
		}
		if (ok) toast.success(`${ok} akun ${labelOk}`);
		if (fail) toast.error(`${fail} akun gagal diproses`);
		if (ok) await load({ silent: true });
	};

	const handleBulkDeactivate = async (ids: string[]) => {
		const targets = users.filter(
			(u) => ids.includes(u.id) && u.id !== currentUser?.id && u.isAktif,
		);
		if (!targets.length) {
			toast.info("Tidak ada akun aktif yang bisa dinonaktifkan.");
			return;
		}

		// Optimistic update: langsung nonaktifkan akun terpilih di UI
		setUsers((prev) =>
			prev.map((u) =>
				ids.includes(u.id) && u.id !== currentUser?.id ? { ...u, isAktif: false } : u,
			),
		);

		let ok = 0;
		let fail = 0;
		const failedIds: string[] = [];

		for (const u of targets) {
			try {
				await updateUser(u.id, { isAktif: false });
				ok++;
			} catch {
				fail++;
				failedIds.push(u.id);
			}
		}

		// Rollback hanya untuk akun yang gagal diproses
		if (failedIds.length > 0) {
			setUsers((prev) =>
				prev.map((u) => (failedIds.includes(u.id) ? { ...u, isAktif: true } : u)),
			);
		}

		if (ok) toast.success(`${ok} akun dinonaktifkan`);
		if (fail) toast.error(`${fail} akun gagal diproses`);
		if (ok) await load({ silent: true });
	};

	const handleBulkDelete = async (ids: string[]) => {
		const targets = users.filter((u) => ids.includes(u.id) && u.id !== currentUser?.id);
		if (!targets.length) return;

		// Optimistic update: hapus dari daftar lokal
		setUsers((prev) => prev.filter((u) => !ids.includes(u.id) || u.id === currentUser?.id));
		await runSequential(targets, async (u) => deleteUser(u.id), "dihapus");
	};

	const handleToggleActive = async (user: ManagedUser) => {
		if (user.id === currentUser?.id) return;
		const nextActive = !user.isAktif;

		// Optimistic update: seketika ubah status lokal tanpa memicu skeleton reload
		setUsers((prev) =>
			prev.map((u) => (u.id === user.id ? { ...u, isAktif: nextActive } : u)),
		);

		try {
			await updateUser(user.id, { isAktif: nextActive });
			toast.success(
				`Akun ${user.profile?.nama || user.username} ${nextActive ? "diaktifkan" : "dinonaktifkan"}`,
			);
			// Sinkronisasi dengan server di latar belakang tanpa reload skeleton
			await load({ silent: true });
		} catch (e: any) {
			// Rollback ke status semula jika request gagal
			setUsers((prev) =>
				prev.map((u) => (u.id === user.id ? { ...u, isAktif: user.isAktif } : u)),
			);
			toast.error(e.message || "Gagal mengubah status akun");
		}
	};

	const handleDelete = async (user: ManagedUser) => {
		if (user.id === currentUser?.id) return;
		// Optimistic update: langsung hilangkan dari tabel lokal
		setUsers((prev) => prev.filter((u) => u.id !== user.id));
		try {
			await deleteUser(user.id);
			toast.success(`Akun ${user.profile?.nama || user.username} dihapus`);
			await load({ silent: true });
		} catch (e: any) {
			toast.error(e.message || "Gagal menghapus user");
			await load();
		}
	};

	return {
		users,
		currentUserId: currentUser?.id ?? null,
		isLoading,
		error,
		successCredential,
		setSuccessCredential,
		reload: load,
		handleCreate,
		handleUpdate,
		handleResetPassword,
		handleToggleActive,
		handleDelete,
		handleBulkDeactivate,
		handleBulkDelete,
	};
}
