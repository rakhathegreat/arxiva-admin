import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/modules/auth/auth";
import { api, getApiErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SettingsSection, SettingRow } from "./SettingsSection";

interface PasswordFieldProps {
	id: string;
	label: string;
	value: string;
	autoComplete: "current-password" | "new-password";
	placeholder?: string;
	hint?: string;
	onChange: (value: string) => void;
}

function PasswordField({
	id,
	label,
	value,
	autoComplete,
	placeholder,
	hint,
	onChange,
}: PasswordFieldProps) {
	const [visible, setVisible] = useState(false);

	return (
		<SettingRow id={id} label={label} hint={hint}>
			<div className="relative">
				<Input
					id={id}
					type={visible ? "text" : "password"}
					value={value}
					autoComplete={autoComplete}
					placeholder={placeholder}
					className="pr-9"
					onChange={(e) => onChange(e.target.value)}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onClick={() => setVisible((v) => !v)}
					aria-label={visible ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
				>
					{visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
				</Button>
			</div>
		</SettingRow>
	);
}

export function SecuritySection() {
	const { user } = useAuth();
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const hasChanges = Boolean(oldPassword || newPassword || confirmPassword);

	const reset = () => {
		setOldPassword("");
		setNewPassword("");
		setConfirmPassword("");
	};

	const handleSavePassword = async () => {
		if (!oldPassword || !newPassword || !confirmPassword) {
			toast.error("Semua kolom harus diisi");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Kata sandi baru dan konfirmasi tidak cocok");
			return;
		}
		if (newPassword.length < 6) {
			toast.error("Kata sandi baru minimal 6 karakter");
			return;
		}

		setIsSaving(true);
		try {
			if (!user) {
				toast.error("User tidak ditemukan");
				return;
			}

			// 1. Verifikasi kata sandi lama lewat endpoint login
			try {
				await api.post("/auth/login", {
					username: user.username,
					password: oldPassword,
				});
			} catch {
				toast.error("Kata sandi lama salah");
				return;
			}

			// 2. Simpan kata sandi baru
			await api.put(`/users/${user.id}`, {
				password: newPassword,
			});

			toast.success("Kata sandi berhasil diperbarui");
			reset();
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Gagal mengubah kata sandi"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SettingsSection
			id="keamanan"
			title="Keamanan"
			description="Ubah kata sandi akun."
			footer={
				<>
					{hasChanges && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={reset}
							disabled={isSaving}
							className="w-full sm:w-auto"
						>
							Batal
						</Button>
					)}
					<Button
						type="submit"
						form="security-form"
						size="sm"
						disabled={!hasChanges || isSaving}
						className="w-full rounded-md sm:w-auto"
					>
						{isSaving && <Loader2 className="size-3.5 animate-spin" />}
						{isSaving ? "Menyimpan..." : "Simpan"}
					</Button>
				</>
			}
		>
			<form
				id="security-form"
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					void handleSavePassword();
				}}
			>
				<PasswordField
					id="current-password"
					label="Kata sandi saat ini"
					value={oldPassword}
					autoComplete="current-password"
					placeholder="Masukkan kata sandi saat ini"
					onChange={setOldPassword}
				/>

				<PasswordField
					id="new-password"
					label="Kata sandi baru"
					value={newPassword}
					autoComplete="new-password"
					placeholder="Masukkan kata sandi baru"
					hint="Minimal 6 karakter."
					onChange={setNewPassword}
				/>

				<PasswordField
					id="confirm-password"
					label="Konfirmasi kata sandi baru"
					value={confirmPassword}
					autoComplete="new-password"
					placeholder="Ketik ulang kata sandi baru"
					onChange={setConfirmPassword}
				/>
			</form>
		</SettingsSection>
	);
}
