import * as React from "react";
import { ChevronDown, KeyRound, Plus, Search, Users } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { getAvatarGradient } from "@/shared/ui/avatar";
import {
	DataTable,
	createRowActionsColumn,
	type RowAction,
} from "@/shared/ui/data-table/DataTable";
import { Input } from "@/shared/ui/input";
import { Kbd } from "@/shared/ui/kbd";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { cn } from "@/shared/lib/utils";
import { useManajemenUser } from "./hooks/useManajemenUser";
import type { ManagedUser, UserPayload } from "./api/userApi";
import { DEFAULT_PASSWORD, suggestUsername } from "./utils/credentials";
import { ROLE_META, toBackendRole, type BackendRole } from "./components/role-meta";
import { UserFormModal } from "./components/UserFormModal";
import { UserSuccessModal } from "./components/UserSuccessModal";
import {
	UserFilterPopover,
	type RoleTabKey,
	type StatusKey,
	type SortKey,
} from "./components/UserFilterPopover";

function RoleBadge({ role }: { role: ManagedUser["role"] }) {
	const meta = ROLE_META[toBackendRole(role)];
	return (
		<Badge variant="quiet" size="md" tone={meta.tone} className="shrink-0 rounded-md">
			{meta.label}
		</Badge>
	);
}

function StatusBadge({ active }: { active: boolean }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
			<span
				aria-hidden
				className={cn(
					"size-1.5 rounded-full transition-colors duration-200",
					active ? "bg-success" : "bg-muted-foreground/40",
				)}
			/>
			<span
				className={cn(
					"transition-colors duration-200",
					active ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{active ? "Aktif" : "Nonaktif"}
			</span>
		</span>
	);
}

function NamaCell({ user }: { user: ManagedUser }) {
	const nama = user.profile?.nama || "—";
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<span
				aria-hidden
				className={cn(
					"flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white select-none shadow-xs",
					getAvatarGradient(user.profile?.nama || user.username),
				)}
			></span>
			<span className="text-xs text-foreground">{nama}</span>
		</div>
	);
}

function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	onClose,
	onConfirm,
}: {
	open: boolean;
	title: string;
	description: React.ReactNode;
	confirmLabel: string;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
					<AlertDialogDescription className="text-xs">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel className="cursor-pointer text-xs">Batal</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="cursor-pointer bg-destructive text-xs text-background hover:bg-destructive/90"
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** Halaman Manajemen User (admin-only): daftar akun + tambah/edit/reset/hapus. */
export default function ManajemenUserPage() {
	const {
		users,
		currentUserId,
		isLoading,
		error,
		successCredential,
		setSuccessCredential,
		reload,
		handleCreate,
		handleUpdate,
		handleResetPassword,
		handleToggleActive,
		handleDelete,
		handleBulkDeactivate,
		handleBulkDelete,
	} = useManajemenUser();

	const [searchQuery, setSearchQuery] = React.useState("");
	const [roleTab, setRoleTab] = React.useState<RoleTabKey>("all");
	const [statusFilter, setStatusFilter] = React.useState<StatusKey>("all");
	const [sortBy, setSortBy] = React.useState<SortKey>("default");
	const [formOpen, setFormOpen] = React.useState(false);
	const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null);
	const [resetTarget, setResetTarget] = React.useState<ManagedUser | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<ManagedUser | null>(null);
	const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
	const [isBulkRunning, setIsBulkRunning] = React.useState(false);

	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// Keyboard shortcuts: "/" to focus search, "Escape" to clear search
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;

			const target = e.target as HTMLElement | null;
			const isInputActive =
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.tagName === "SELECT" ||
				target?.isContentEditable;

			if (e.key === "/" && !isInputActive) {
				e.preventDefault();
				searchInputRef.current?.focus();
				return;
			}

			if (e.key === "Escape" && !isInputActive) {
				const hasOpenModal =
					formOpen ||
					Boolean(resetTarget) ||
					Boolean(deleteTarget) ||
					Boolean(bulkDeleteIds) ||
					Boolean(successCredential);

				if (!hasOpenModal && searchQuery !== "") {
					e.preventDefault();
					setSearchQuery("");
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [formOpen, resetTarget, deleteTarget, bulkDeleteIds, successCredential, searchQuery]);

	const selectedIds = React.useMemo(() => {
		return Object.entries(rowSelection)
			.filter(([, selected]) => Boolean(selected))
			.map(([id]) => id);
	}, [rowSelection]);

	const filteredUsers = React.useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const result = users.filter((u) => {
			const matchesSearch =
				q === "" ||
				u.username.toLowerCase().includes(q) ||
				(u.profile?.nama || "").toLowerCase().includes(q);
			const matchesRole = roleTab === "all" || toBackendRole(u.role) === roleTab;
			const matchesStatus =
				statusFilter === "all" || (statusFilter === "active") === u.isAktif;
			return matchesSearch && matchesRole && matchesStatus;
		});

		if (sortBy === "name-asc") {
			result.sort((a, b) =>
				(a.profile?.nama || a.username).localeCompare(b.profile?.nama || b.username),
			);
		} else if (sortBy === "name-desc") {
			result.sort((a, b) =>
				(b.profile?.nama || b.username).localeCompare(a.profile?.nama || a.username),
			);
		} else if (sortBy === "date-desc") {
			result.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		} else if (sortBy === "date-asc") {
			result.sort(
				(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			);
		}

		return result;
	}, [users, searchQuery, roleTab, statusFilter, sortBy]);

	const resetFilters = React.useCallback(() => {
		setSearchQuery("");
		setRoleTab("all");
		setStatusFilter("all");
		setSortBy("default");
	}, []);

	const openAdd = React.useCallback(() => {
		setEditingUser(null);
		setFormOpen(true);
	}, []);

	const openEdit = React.useCallback((user: ManagedUser) => {
		setEditingUser(user);
		setFormOpen(true);
	}, []);

	const handleFormSubmit = React.useCallback(
		async (payload: Omit<UserPayload, "username" | "password">) => {
			if (editingUser) {
				await handleUpdate(editingUser.id, payload);
				return;
			}
			const username = suggestUsername(
				payload.nama,
				users.map((u) => u.username),
			);
			await handleCreate({ ...payload, username, password: DEFAULT_PASSWORD });
		},
		[editingUser, handleCreate, handleUpdate, users],
	);

	const columns = React.useMemo<ColumnDef<ManagedUser>[]>(
		() => [
			{
				id: "nama",
				header: "Nama",
				cell: ({ row }) => <NamaCell user={row.original} />,
			},
			{
				id: "username",
				header: "Username",
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{row.original.username}</span>
				),
			},
			{
				id: "role",
				header: "Role",
				meta: { className: "w-28" },
				cell: ({ row }) => <RoleBadge role={row.original.role} />,
			},
			{
				id: "email",
				header: "Email",
				cell: ({ row }) => {
					const email = row.original.profile?.email;
					return email && email !== "-" ? (
						<span className="block max-w-52 truncate text-xs text-foreground underline decoration-1 underline-offset-3">
							{email}
						</span>
					) : (
						<span className="text-xs text-foreground">—</span>
					);
				},
			},
			{
				id: "telepon",
				header: "Telepon",
				cell: ({ row }) => {
					const phone = row.original.profile?.telepon;
					return phone && phone !== "-" ? (
						<span className="text-xs tabular-nums text-foreground">{phone}</span>
					) : (
						<span className="text-xs text-muted-foreground">—</span>
					);
				},
			},
			{
				id: "tanggal",
				header: "Tanggal Dibuat",
				cell: ({ row }) => {
					const date = new Date(row.original.createdAt);
					return (
						<span className="text-xs text-foreground">
							{date.toLocaleDateString("id-ID", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							})}
						</span>
					);
				},
			},
			{
				id: "status",
				header: "Status",
				meta: { className: "w-28" },
				cell: ({ row }) => <StatusBadge active={row.original.isAktif} />,
			},
			createRowActionsColumn<ManagedUser>((u) => {
				const isSelf = u.id === currentUserId;
				const actions: RowAction<ManagedUser>[] = [
					{ label: "Edit Akun", onClick: () => openEdit(u) },
				];
				if (!isSelf) {
					actions.push(
						{
							label: "Reset Password",
							onClick: () => setResetTarget(u),
						},
						{
							label: u.isAktif ? "Nonaktifkan" : "Aktifkan",
							onClick: () => handleToggleActive(u),
						},
						{
							label: "Hapus",
							destructive: true,
							onClick: () => setDeleteTarget(u),
						},
					);
				}
				return actions;
			}),
		],
		[currentUserId, openEdit, handleToggleActive],
	);

	const activeFilterCount =
		(roleTab !== "all" ? 1 : 0) +
		(statusFilter !== "all" ? 1 : 0) +
		(sortBy !== "default" ? 1 : 0);
	const hasActiveFilter = searchQuery !== "" || activeFilterCount > 0;

	if (error && !isLoading) {
		return (
			<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center p-6">
				<div className="rounded-md border border-dashed px-8 py-12 text-center">
					<p className="text-sm font-medium text-foreground">Daftar user gagal dimuat</p>
					<p className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-4 cursor-pointer gap-2 text-xs"
						onClick={() => reload()}
					>
						Coba lagi
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 overflow-y-auto p-4 md:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="page-title">Kelola User</h1>
				</div>
				<Button
					size="sm"
					className="h-7 w-fit cursor-pointer gap-2 rounded-md font-medium transition-transform active:scale-99"
					onClick={openAdd}
				>
					<Plus className="size-4" /> Buat Akun Baru
				</Button>
			</header>

			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<div className="relative w-full sm:flex-1">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							ref={searchInputRef}
							type="search"
							placeholder="Cari nama atau username..."
							className="pl-9 pr-16 text-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									e.preventDefault();
									setSearchQuery("");
									searchInputRef.current?.blur();
								}
							}}
						/>
						<div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
							{searchQuery !== "" ? (
								<>
									<Kbd
										className="font-sans cursor-pointer select-none pointer-events-auto"
										onClick={() => {
											setSearchQuery("");
											searchInputRef.current?.blur();
										}}
										title="Tekan Esc untuk hapus pencarian"
									>
										Esc
									</Kbd>
								</>
							) : (
								<Kbd title="Tekan / untuk mencari">/</Kbd>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 sm:ml-auto">
						<UserFilterPopover
							roleTab={roleTab}
							onRoleTabChange={setRoleTab}
							statusFilter={statusFilter}
							onStatusFilterChange={setStatusFilter}
							sortBy={sortBy}
							onSortByChange={setSortBy}
						/>

						{selectedIds.length > 0 && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										disabled={isBulkRunning}
										className="h-8 cursor-pointer gap-1.5 px-3 text-xs hover:text-foreground font-medium animate-in fade-in-50 duration-150"
									>
										<span>Bulk Action</span>
										<span className="shrink-0 bg-accent px-1.5 py-0.5 text-xs font-medium rounded-full">
											{selectedIds.length}
										</span>
										<ChevronDown className="size-3 opacity-60" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-36">
									<DropdownMenuItem
										disabled={isBulkRunning}
										onClick={async () => {
											setIsBulkRunning(true);
											try {
												await handleBulkDeactivate(selectedIds);
												setRowSelection({});
											} finally {
												setIsBulkRunning(false);
											}
										}}
										className="cursor-pointer text-sm gap-2"
									>
										<span>Nonaktifkan</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isBulkRunning}
										onClick={() => setBulkDeleteIds(selectedIds)}
										variant="destructive"
										className="cursor-pointer text-sm gap-2"
									>
										<span>Hapus</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setRowSelection({})}
										className="cursor-pointer text-sm gap-2 text-muted-foreground bg-muted/5 hover:bg-muted/10"
									>
										<span>Batalkan pilihan</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>

			<DataTable<ManagedUser>
				data={filteredUsers}
				enableSelection
				getRowId={(row) => row.id}
				rowSelection={rowSelection}
				onRowSelectionChange={setRowSelection}
				columns={columns}
				isLoading={isLoading}
				pagination="client"
				className="pb-10"
				emptyState={{
					icon: Users,
					title: hasActiveFilter
						? "Tidak ada user yang cocok"
						: "Belum ada user terdaftar",
					description: hasActiveFilter
						? "Tidak ditemukan akun sesuai kata kunci atau filter saat ini."
						: "Tambahkan akun pertama agar bisa digunakan untuk login.",
					action: hasActiveFilter ? (
						<Button
							variant="outline"
							size="sm"
							className="cursor-pointer text-xs"
							onClick={resetFilters}
						>
							Bersihkan filter
						</Button>
					) : (
						<Button
							size="sm"
							className="cursor-pointer gap-2 text-xs"
							onClick={openAdd}
						>
							<Plus className="size-3.5" /> Tambah Akun
						</Button>
					),
				}}
			/>

			<UserFormModal
				isOpen={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditingUser(null);
				}}
				user={editingUser}
				defaultRole={roleTab === "all" ? null : (roleTab as BackendRole)}
				currentUserId={currentUserId}
				isSaving={isLoading}
				onSubmit={handleFormSubmit}
			/>

			<AlertDialog
				open={resetTarget !== null}
				onOpenChange={(open) => !open && setResetTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base">
							Reset password akun ini?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							Password <strong>{resetTarget?.username}</strong> akan diubah ke{" "}
							<strong className="font-mono">{DEFAULT_PASSWORD}</strong>. Berikan
							kredensial ini kepada yang bersangkutan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="cursor-pointer text-xs">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (resetTarget) handleResetPassword(resetTarget, DEFAULT_PASSWORD);
								setResetTarget(null);
							}}
							className="cursor-pointer text-xs"
						>
							<KeyRound className="mr-2 size-4" /> Reset Password
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<UserSuccessModal
				credential={successCredential}
				onClose={() => setSuccessCredential(null)}
			/>

			<ConfirmDialog
				open={bulkDeleteIds !== null}
				title={`Hapus ${bulkDeleteIds?.length ?? 0} akun terpilih?`}
				description="Akun yang dipilih akan dihapus permanen dan tidak dapat digunakan untuk login lagi. Tindakan ini tidak dapat dibatalkan."
				confirmLabel="Hapus Akun"
				onClose={() => setBulkDeleteIds(null)}
				onConfirm={async () => {
					if (bulkDeleteIds) {
						await handleBulkDelete(bulkDeleteIds);
						setRowSelection({});
					}
					setBulkDeleteIds(null);
				}}
			/>

			<ConfirmDialog
				open={deleteTarget !== null}
				title={`Hapus akun ${deleteTarget?.profile?.nama || deleteTarget?.username || ""}?`}
				description={
					<>
						Akun <strong>{deleteTarget?.username}</strong> akan dihapus permanen dan
						tidak dapat digunakan untuk login lagi. Tindakan ini tidak dapat dibatalkan.
					</>
				}
				confirmLabel="Hapus Akun"
				onClose={() => setDeleteTarget(null)}
				onConfirm={() => {
					if (deleteTarget) handleDelete(deleteTarget);
					setDeleteTarget(null);
				}}
			/>
		</div>
	);
}
