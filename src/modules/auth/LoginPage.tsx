import { useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"

import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useAuth } from "@/modules/auth/auth"

/**
 * Halaman Utama Login (LoginPage)
 *
 * Komponen ini menangani antarmuka autentikasi pengguna. Menghubungkan form login
 * ke fungsi `login` dari context autentikasi global (`useAuth`).
 *
 * @returns {JSX.Element} Antarmuka halaman login.
 */
export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  /**
   * Menangani aksi submit pada form login.
   * Melakukan validasi input dasar, menampilkan loading state, dan memanggil fungsi autentikasi.
   *
   * @param {FormEvent<HTMLFormElement>} event - Event default dari form HTML
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Mencegah reload halaman secara default
    event.preventDefault()
    setErrorMessage("")

    if (!username.trim() || !password) {
      setErrorMessage("Username dan password wajib diisi.")
      return
    }

    setIsSubmitting(true)
    try {
      // Memanggil fungsi login dari AuthContext (API Call)
      await login(username.trim(), password)

      // Jika berhasil, arahkan pengguna kembali ke halaman utama (dashboard)
      navigate("/", { replace: true })
    } catch (error) {
      // Tangkap dan tampilkan error kembalian dari API ke pengguna
      setErrorMessage(
        typeof error === "string"
          ? error
          : "Login gagal. Periksa kembali username dan password."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-background p-4 sm:p-6">
      <div className="grid w-full max-w-[400px] gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-md border border-border bg-white text-[13px] leading-none text-black"
            >
              ▲
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium tracking-tight">Arxiva</span>
              <span className="meta-label">Inventory System</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="eyebrow text-stone">Masuk ke akun</p>
            <h1 className="text-heading font-[450] text-foreground">
              Masuk ke Arxiva
            </h1>
            <p className="text-caption text-muted-foreground">
              Gunakan akun Admin atau Mitra yang telah terdaftar.
            </p>
          </div>
        </header>

        <Card className="gap-5 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-sm">Kredensial</CardTitle>
            <CardDescription className="meta-label">
              Akses terbatas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="meta-label">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Masukkan username"
                  className="h-9"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="meta-label">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="h-9 pr-9 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription className="text-caption">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button className="mt-1 h-9 w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memeriksa akun...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center font-mono text-[10px] leading-relaxed tracking-[0.071em] text-muted-foreground uppercase">
          Pendaftaran mandiri tidak tersedia.
          <br />
          Akun dibuat oleh administrator.
        </p>
      </div>
    </main>
  )
}
