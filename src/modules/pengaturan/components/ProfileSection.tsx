import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/modules/auth/auth";
import { api, getApiErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SettingsSection, SettingRow } from "./SettingsSection";

export function ProfileSection() {
	const { user, updateUser } = useAuth();

	const originalPicName = user?.profile?.picName || user?.displayName || "";
	const originalUsername = user?.username || "";

	const [picName, setPicName] = useState(originalPicName);
	const [username, setUsername] = useState(originalUsername);
	const [isSaving, setIsSaving] = useState(false);

	const hasChanges = picName !== originalPicName || username !== originalUsername;

	const reset = () => {
		setPicName(originalPicName);
		setUsername(originalUsername);
	};

	const handleSaveProfile = async () => {
		if (!user) return;
		setIsSaving(true);
		try {
			const res = await api.put(`/users/${user.id}`, {
				username,
				picName,
			});

			if (res.data) {
				updateUser({
					...user,
					username,
					profile: {
						...user.profile,
						picName,
					},
				});
				toast.success("Profil berhasil disimpan");
			}
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Gagal menyimpan profil"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SettingsSection
			id="profil"
			title="Profil"
			description="Informasi akun Anda."
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
						form="profile-form"
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
				id="profile-form"
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					void handleSaveProfile();
				}}
			>
				<SettingRow id="profile-username" label="Username" hint="Dipakai untuk login.">
					<Input
						id="profile-username"
						type="text"
						value={username}
						autoComplete="username"
						onChange={(e) => setUsername(e.target.value)}
					/>
				</SettingRow>

				<SettingRow
					id="profile-pic-name"
					label="Nama / PIC"
					hint="Nama yang muncul di dokumen BAST."
				>
					<Input
						id="profile-pic-name"
						type="text"
						value={picName}
						autoComplete="name"
						onChange={(e) => setPicName(e.target.value)}
					/>
				</SettingRow>
			</form>
		</SettingsSection>
	);
}
