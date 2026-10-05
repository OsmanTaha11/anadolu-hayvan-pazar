import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Yeni Şifre Belirle — ÇiftlikPazar" },
      { name: "description", content: "ÇiftlikPazar hesabınız için yeni bir şifre belirleyin." },
      { property: "og:title", content: "Yeni Şifre Belirle — ÇiftlikPazar" },
      { property: "og:description", content: "Hesabınız için yeni şifre oluşturun." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Şifre güncellenemedi: " + error.message);
      return;
    }
    toast.success("Şifreniz güncellendi.");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <form onSubmit={submit} className="surface-panel w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-xl font-bold">Yeni Şifre Belirle</h1>
        <div>
          <Label htmlFor="np">Yeni şifre</Label>
          <Input id="np" type="password" className="mt-1 h-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          Şifreyi Kaydet
        </Button>
      </form>
    </div>
  );
}
