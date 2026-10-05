import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

import { ROLE_LABELS, CITIES } from "@/lib/marketplace";

export const Route = createFileRoute("/giris")({
  head: () => ({
    meta: [
      { title: "Giriş Yap veya Kayıt Ol — ÇiftlikPazar" },
      {
        name: "description",
        content:
          "Alıcı, üretici veya veteriner hekim olarak ÇiftlikPazar hesabınıza giriş yapın ya da ücretsiz kayıt olun.",
      },
      { property: "og:title", content: "Giriş Yap — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "Veteriner onaylı hayvan pazarına alıcı, satıcı veya veteriner olarak katılın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

const signUpSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta girin").max(255),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(72),
  fullName: z.string().trim().min(2, "Ad soyad gerekli").max(100),
  phone: z.string().trim().max(20).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Konya");
  const [role, setRole] = useState("seller");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const msg = /invalid login/i.test(error.message)
        ? "E-posta veya şifre hatalı. Şifrenizi unuttuysanız aşağıdan sıfırlayabilirsiniz."
        : /not confirmed/i.test(error.message)
          ? "E-postanızı henüz onaylamadınız. Gelen kutunuzdaki bağlantıya tıklayın."
          : error.message;
      toast.error("Giriş başarısız: " + msg);
      return;
    }
    toast.success("Hoş geldiniz!");
    navigate({ to: "/", replace: true });
  };

  const forgot = async () => {
    const target = email.trim();
    if (!target) {
      toast.error("Önce e-posta adresinizi yazın.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ email, password, fullName, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          phone_number: parsed.data.phone ?? "",
          city,
          role,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Kayıt başarısız: " + error.message);
      return;
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      toast.error("Bu e-posta ile zaten bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.");
      return;
    }
    if (!data.session) {
      toast.success("Kayıt alındı! E-postanıza gelen onay bağlantısına tıklayıp sonra giriş yapın.", { duration: 8000 });
      return;
    }
    toast.success("Kayıt tamamlandı.");
    navigate({ to: "/", replace: true });
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <span className="font-display text-lg font-bold">ÇiftlikPazar</span>
      </Link>

      <div className="surface-panel w-full max-w-md p-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
            <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  className="mt-1 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                Giriş Yap
              </Button>
              <button
                type="button"
                onClick={forgot}
                disabled={loading}
                className="w-full text-center text-sm text-muted-foreground underline"
              >
                Şifremi unuttum
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  className="mt-1 h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="suEmail">E-posta</Label>
                <Input
                  id="suEmail"
                  type="email"
                  className="mt-1 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="suPassword">Şifre</Label>
                <Input
                  id="suPassword"
                  type="password"
                  className="mt-1 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  className="mt-1 h-11"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Şehir</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="mt-1 h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hesap Türü</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="mt-1 h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["seller", "vet"].map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                Kayıt Ol
              </Button>
            </form>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
