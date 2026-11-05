import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { PenTool, Smartphone, Loader2, Eraser, Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import { api, getBaseUrl } from "@/shared/lib/api";
import QRCode from "qrcode";
import { useAuth } from "@/modules/auth/auth";
import { getSignatureDataUrl } from "@/shared/lib/trimCanvas";

interface DigitalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSignComplete: () => void;
}

const isUnsupportedStoredSignature = (value?: string | null) =>
  typeof value === "string" && value.startsWith("data:image/svg+xml");

const SESSION_TIMEOUT_SECONDS = 180;

export function DigitalSignatureDialog({
  open,
  onOpenChange,
  title = "Tanda Tangan Digital BAST",
  description = "Silakan berikan tanda tangan Anda untuk pengesahan dokumen BAST ini.",
  onSignComplete,
}: DigitalSignatureDialogProps) {
  const { user, updateUser } = useAuth();
  const sigPad = useRef<SignatureCanvas>(null);

  const [activeTab, setActiveTab] = useState<"canvas" | "qr">("canvas");
  const [isSigning, setIsSigning] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_TIMEOUT_SECONDS);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const savedProfileSignature = user?.profile?.picSignatureUrl;
  const hasProfileSignature = !!savedProfileSignature && !isUnsupportedStoredSignature(savedProfileSignature);

  // Load profile signature into canvas if opening or switching
  useEffect(() => {
    if (open && hasProfileSignature && activeTab === "canvas") {
      const timer = setTimeout(() => {
        if (sigPad.current && savedProfileSignature) {
          sigPad.current.fromDataURL(savedProfileSignature);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, hasProfileSignature, savedProfileSignature, activeTab]);

  const handleClear = () => {
    sigPad.current?.clear();
  };

  const handleUseProfileSignature = () => {
    if (!savedProfileSignature || !sigPad.current) return;
    sigPad.current.clear();
    sigPad.current.fromDataURL(savedProfileSignature);
    toast.success("Tanda tangan profil berhasil dimuat ke kanvas!");
  };

  const startQrSession = useCallback(async () => {
    setQrLoading(true);
    setQrCodeUrl("");
    setTimeLeft(SESSION_TIMEOUT_SECONDS);

    try {
      const res = await api.post(`/signature-session`);
      const sessionId = res.data.id;

      const backendBaseUrl = getBaseUrl();
      const mobileUrl = `${backendBaseUrl}/signature-session/${sessionId}/mobile`;
      const url = await QRCode.toDataURL(mobileUrl, { width: 320, margin: 2 });

      setQrCodeUrl(url);
      setQrLoading(false);

      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(async () => {
        try {
          const pollRes = await api.get(`/signature-session/${sessionId}`);
          if (pollRes.data.status === "COMPLETED" && pollRes.data.signatureUrl) {
            setActiveTab("canvas");
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            if (timerRef.current) clearInterval(timerRef.current);

            setTimeout(() => {
              const newSigUrl = pollRes.data.signatureUrl;
              if (sigPad.current && newSigUrl) {
                sigPad.current.fromDataURL(newSigUrl);
              }

              if (user) {
                updateUser({
                  profile: {
                    ...user.profile,
                    picSignatureUrl: newSigUrl,
                  },
                });
              }
            }, 100);

            toast.success("Tanda tangan berhasil ditangkap dari HP!");
          }
        } catch (err: any) {
          if (err.response?.status === 400 && err.response?.data?.message === "Session expired") {
            void startQrSession();
          }
        }
      }, 2000);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            void startQrSession();
            return SESSION_TIMEOUT_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Gagal membuat sesi QR Code");
      setQrLoading(false);
    }
  }, [user, updateUser]);

  useEffect(() => {
    if (activeTab === "qr") {
      void startQrSession();
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeTab, startQrSession]);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (sigPad.current?.isEmpty()) {
      toast.error("Tanda tangan tidak boleh kosong");
      return;
    }

    setIsSigning(true);
    try {
      const signatureDataUrl = getSignatureDataUrl(sigPad.current!);

      if (user) {
        await api.put(`/users/${user.id}`, {
          picSignatureUrl: signatureDataUrl,
        });
        updateUser({
          profile: {
            ...user.profile,
            picSignatureUrl: signatureDataUrl,
          },
        });
      }

      onSignComplete();
    } catch (error) {
      toast.error("Gagal memproses tanda tangan");
    } finally {
      setIsSigning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        onOpenChange(val);
      }}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <PenTool className="size-4 text-success" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        {/* Mode Selector Segmented Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "canvas" | "qr")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="canvas" className="gap-1.5">
              <PenTool className="size-3.5" />
              <span>TTD di Layar</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1.5">
              <Smartphone className="size-3.5" />
              <span>Scan via HP</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "qr" ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            {qrLoading ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 animate-spin text-foreground" />
                <span className="text-xs text-muted-foreground">Menyiapkan QR Code...</span>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border bg-white p-3">
                  <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48 rounded-md" />
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="glass" size="md" tone="emerald">
                    <span className="relative flex size-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--badge-tone)] opacity-60" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-[var(--badge-tone)]" />
                    </span>
                    Sesi Aktif
                  </Badge>

                  <Badge variant="quiet" size="md" tone="zinc">
                    {formatTime(timeLeft)}
                  </Badge>
                </div>

                <p className="text-xs text-center text-muted-foreground leading-relaxed px-4">
                  Pindai QR Code ini dengan kamera HP Anda untuk membuat tanda tangan layar penuh.
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void startQrSession()}
                  className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8">
                  <RefreshCw className="size-3" /> Refresh QR Manual
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-1">
            {/* 1-Click Profile Signature Fill Button */}
            {hasProfileSignature && (
              <div className="flex items-center justify-between rounded-md border border-success/20 bg-success/10 px-3 py-2 text-xs">
                <span className="text-success font-medium">TTD Default Profil Tersedia</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUseProfileSignature}
                  className="h-7 gap-1 text-[11px] font-medium">
                  <Sparkles className="size-3" />
                  Gunakan TTD Profil
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Kanvas Tanda Tangan</span>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 gap-1 px-2 text-xs">
                <Eraser className="size-3.5" /> Bersihkan
              </Button>
            </div>

            {/* Desktop Canvas Container with Baseline Guide */}
            <div className="relative h-[190px] overflow-hidden rounded-md border border-border bg-white dark:bg-background">
              <SignatureCanvas
                ref={sigPad}
                penColor="black"
                canvasProps={{
                  width: 600,
                  height: 190,
                  style: { width: "100%", height: "100%" },
                  className: "cursor-crosshair",
                }}
              />
              <div className="absolute inset-x-6 bottom-8 pointer-events-none border-b border-dashed border-border pb-1 flex items-center justify-center">
                <span className="font-mono text-[10px] tracking-[0.071em] text-muted-foreground uppercase select-none opacity-60">
                  Garis Panduan Tanda Tangan
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Tanda tangan ini akan disimpan di profil Anda dan dilampirkan langsung pada dokumen BAST.
            </p>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning} className="text-xs">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSigning || activeTab === "qr"}
            className="gap-2 text-xs font-medium">
            {isSigning ? <Loader2 className="size-3.5 animate-spin" /> : <PenTool className="size-3.5" />}
            Konfirmasi Tanda Tangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
