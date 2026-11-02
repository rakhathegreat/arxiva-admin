import { useState, useRef } from "react";
import { useAuth } from "@/modules/auth/auth";
import { toast } from "sonner";
import { Smartphone, Loader2, Eraser, CheckCircle2, ShieldCheck, Camera, QrCode, PenTool } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { api, getBaseUrl } from "@/shared/lib/api";
import QRCode from "qrcode";

export function SignatureTab() {
  const { user, updateUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const hasSignature = !!user?.profile?.picSignatureUrl;
  const signatureUrl = user?.profile?.picSignatureUrl;

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        picSignatureUrl: null,
      });

      if (res.data) {
        updateUser({
          profile: {
            ...user.profile,
            picSignatureUrl: null,
          },
        });
        toast.success("Tanda tangan profil berhasil dihapus");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus tanda tangan");
    } finally {
      setIsDeleting(false);
    }
  };

  const startQrSession = async () => {
    try {
      const res = await api.post(`/signature-session`, { userId: user?.id });
      const sessionId = res.data.id;

      const backendBaseUrl = getBaseUrl();
      const mobileUrl = `${backendBaseUrl}/signature-session/${sessionId}/mobile`;

      const url = await QRCode.toDataURL(mobileUrl, { width: 320, margin: 2 });
      setQrCodeUrl(url);
      setQrModalOpen(true);

      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(async () => {
        try {
          const pollRes = await api.get(`/signature-session/${sessionId}`);
          if (pollRes.data.status === "COMPLETED" && pollRes.data.signatureUrl) {
            if (user) {
              await api.put(`/users/${user.id}`, {
                picSignatureUrl: pollRes.data.signatureUrl,
              });
              updateUser({
                profile: {
                  ...user.profile,
                  picSignatureUrl: pollRes.data.signatureUrl,
                },
              });
            }

            setQrModalOpen(false);
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            toast.success("Tanda tangan profil berhasil diperbarui via HP!");
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 2000);
    } catch (error) {
      toast.error("Gagal membuat sesi QR Code");
    }
  };

  const handleQrModalClose = (open: boolean) => {
    setQrModalOpen(open);
    if (!open && pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow text-stone">Akun</p>
        <h1 className="page-title">Tanda Tangan Digital</h1>
        <p className="text-sm text-muted-foreground">
          Kelola tanda tangan profil default untuk otomatisasi dokumen BAST
        </p>
      </header>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-6 p-6">
            {hasSignature && signatureUrl ? (
              <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
                <Badge variant="success" size="sm">
                  <ShieldCheck className="size-3.5" />
                  <span>Tanda Tangan Tersimpan (Format Transparan)</span>
                </Badge>

                {/* Transparent Checkerboard Pattern Frame */}
                <div className="relative flex h-44 w-full items-center justify-center rounded-md border border-border bg-[radial-gradient(var(--border)_1px,transparent_1px)] p-4 [background-size:16px_16px]">
                  <img
                    src={signatureUrl}
                    alt="Default Signature Preview"
                    className="max-h-36 max-w-full object-contain"
                  />
                  <div className="absolute right-2 bottom-2 rounded-md border border-border bg-card/90 px-2 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur-md">
                    PNG Transparan
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Tanda tangan ini akan digunakan secara otomatis saat Anda menandatangani dokumen BAST di sistem.
                </p>
              </div>
            ) : (
              <div className="flex max-w-md flex-col items-center gap-3 py-4 text-center">
                <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
                  <PenTool className="size-8 opacity-40" />
                </div>
                <h2 className="text-base font-medium">Belum Ada Tanda Tangan Default</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Buat tanda tangan profil Anda sekarang menggunakan HP agar proses pengesahan BAST menjadi cepat dan otomatis.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {hasSignature && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2 text-xs text-destructive">
                  {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Eraser className="size-3.5" />}
                  Hapus Tanda Tangan
                </Button>
              )}
              <Button
                onClick={startQrSession}
                className="gap-2 px-4 text-xs">
                <Smartphone className="size-3.5" />
                {hasSignature ? "Perbarui via HP" : "Buat Tanda Tangan via HP"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanning Modal with 3-Step Guidance */}
      <Dialog open={qrModalOpen} onOpenChange={handleQrModalClose}>
        <DialogContent className="flex flex-col items-center gap-4 p-5 text-center sm:max-w-md">
          <DialogHeader className="w-full space-y-1 text-center">
            <DialogTitle className="text-center text-base font-medium">Tanda Tangan via Smartphone</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Pindai QR Code di bawah untuk membuka kanvas penandatangan di layar ponsel Anda
            </DialogDescription>
          </DialogHeader>

          {qrCodeUrl ? (
            <div className="rounded-md border border-border bg-white p-3">
              <img src={qrCodeUrl} alt="QR Code Mobile Sign" className="h-52 w-52 rounded-md" />
            </div>
          ) : (
            <div className="my-6 flex h-52 w-52 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-foreground" />
            </div>
          )}

          {/* 3-Step Visual Instruction Bar */}
          <div className="grid w-full grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
              <Camera className="mb-1 size-4 text-muted-foreground" />
              <span className="text-[10px] font-medium">1. Buka Kamera</span>
            </div>
            <div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
              <QrCode className="mb-1 size-4 text-muted-foreground" />
              <span className="text-[10px] font-medium">2. Pindai QR Code</span>
            </div>
            <div className="flex flex-col items-center rounded-md border border-border bg-muted/40 p-2 text-center">
              <CheckCircle2 className="mb-1 size-4 text-muted-foreground" />
              <span className="text-[10px] font-medium">3. TTD & Kirim</span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Halaman ini akan otomatis tertutup dan memperbarui profil Anda secara instan setelah menekan <strong className="font-medium text-foreground">Kirim</strong> di layar HP.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
