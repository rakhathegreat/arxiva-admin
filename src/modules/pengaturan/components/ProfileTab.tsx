import { useState } from "react";
import { useAuth } from "@/modules/auth/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { api } from "@/shared/lib/api";

export function ProfileTab() {
  const { user, updateUser } = useAuth();

  const originalPicName = user?.profile?.picName || user?.displayName || "";
  const originalUsername = user?.username || "";
  
  const [picName, setPicName] = useState(originalPicName);
  const [username, setUsername] = useState(originalUsername);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = picName !== originalPicName || username !== originalUsername;

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        username,
        picName
      });

      if (res.data) {
        updateUser({
          ...user,
          username,
          profile: {
            ...user.profile,
            picName,
          }
        });
        toast.success("Profil berhasil disimpan");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow text-stone">Akun</p>
        <h1 className="page-title">Profil Anda</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi identitas Anda</p>
      </header>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Informasi Akun</h2>
        <Card className="rounded-md p-0!">
          <CardContent className="p-0!">
            <div className="flex flex-wrap justify-between p-4">
              <h2 className="font-medium text-sm">Username</h2>
              <Input type="text" value={username} className="max-w-md h-9 rounded-md" onChange={(e) => setUsername(e.target.value)} />
            </div>
            <Separator />
            <div className="flex flex-wrap justify-between p-4">
              <h2 className="font-medium text-sm">Nama / Person In Charge</h2>
              <Input type="text" value={picName} className="max-w-md h-9 rounded-md" onChange={(e) => setPicName(e.target.value)} />
            </div>
            <div className="w-full flex items-center justify-end gap-2 p-4 border-t border-border/50">
              <Button className="active:translate-y-0!" size="sm" variant="outline" onClick={() => { setPicName(originalPicName); setUsername(originalUsername); }} disabled={!hasChanges || isSaving}>
                Batal
              </Button>
              <Button className="active:translate-y-0!" size="sm" variant="default" disabled={!hasChanges || isSaving} onClick={handleSaveProfile}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
