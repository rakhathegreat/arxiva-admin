import { useState } from "react"
import { useAuth } from "@/modules/auth/auth"
import { ProfileTab } from "./components/ProfileTab"
import { SecurityTab } from "./components/SecurityTab"
import { SignatureTab } from "./components/SignatureTab"
import { GoogleDriveTab } from "./components/GoogleDriveTab"
import { SidebarNav } from "./components/SidebarNav"

/**
 * Komponen PengaturanPage
 *
 * Halaman pengaturan global aplikasi (Profil, Keamanan, Tanda Tangan Digital,
 * Google Drive — admin only). Integrasi Google/Drive dipakai khusus untuk
 * membuat spreadsheet & QR code lokasi material.
 */
export default function PengaturanPage() {
  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === "admin"

  // Active Category State for Sidebar Navigation
  const [activeCategory, setActiveCategory] = useState("profil")

  const sidebarGroups = [
    {
      groupLabel: "Pengaturan Akun",
      items: [
        {
          title: "Profil",
          id: "profil"
        },
        {
          title: "Keamanan",
          id: "keamanan"
        },
        {
          title: "Tanda Tangan Digital",
          id: "ttd-digital"
        }
      ]
    },
    {
      groupLabel: "Integrasi",
      items: [
        {
          title: "Google Drive",
          id: "google-drive",
          adminOnly: true
        }
      ]
    }
  ]

  return (
    <div className="@container/main flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="w-full shrink-0 overflow-y-auto border-b border-border lg:w-60 lg:border-r lg:border-b-0">
          <SidebarNav
            groups={sidebarGroups}
            activeId={activeCategory}
            onSelect={setActiveCategory}
            isAdmin={isAdmin}
          />
        </aside>

        <div className="flex-1 overflow-y-auto px-4 pb-12 md:px-6">
          <div className="mx-auto w-full max-w-3xl pt-6">
            {activeCategory === "profil" && <ProfileTab />}
            {activeCategory === "keamanan" && <SecurityTab />}
            {activeCategory === "ttd-digital" && <SignatureTab />}
            {activeCategory === "google-drive" && <GoogleDriveTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
