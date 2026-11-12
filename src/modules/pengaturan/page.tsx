import { useAuth } from "@/modules/auth/auth"
import { GoogleDriveSection } from "./components/GoogleDriveSection"
import { ProfileSection } from "./components/ProfileSection"
import { SecuritySection } from "./components/SecuritySection"
import { SignatureSection } from "./components/SignatureSection"

/**
 * Halaman pengaturan global: profil, keamanan, tanda tangan digital, dan
 * integrasi Google Drive (admin). Tiap bagian punya card sendiri agar
 * tugasnya tidak tercampur, kecuali status dan Folder ID Drive yang
 * merupakan satu integrasi.
 */
export default function PengaturanPage() {
	const { user } = useAuth()
	const isAdmin = user?.role?.toLowerCase() === "admin"

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
			<header className="mb-6 flex flex-col gap-1">
				<h1 className="page-title">Pengaturan</h1>
				<p className="text-sm text-muted-foreground">
					Kelola akun, keamanan, tanda tangan, dan integrasi.
				</p>
			</header>

			<div className="flex flex-col gap-4">
				<ProfileSection />
				<SecuritySection />
				<SignatureSection />
				{isAdmin && <GoogleDriveSection />}
			</div>
		</div>
	)
}
