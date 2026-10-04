import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar — Worship Church Multitrack Player" },
      { name: "description", content: "Inicia sesión o crea tu cuenta para administrar tu iglesia." },
      { property: "og:title", content: "Ingresar — Worship Church Multitrack Player" },
      { property: "og:description", content: "Inicia sesión o crea tu cuenta para administrar tu iglesia." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message.includes("confirm") ? "Confirma tu correo antes de ingresar" : "Correo o contraseña incorrectos");
        nav({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: name } },
        });
        if (error) throw new Error(error.message);
        if (!data.session) setNotice("Te enviamos un correo de confirmación. Ábrelo para activar tu cuenta.");
        else nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw new Error(error.message);
        setNotice("Si el correo existe, recibirás un enlace para restablecer tu contraseña.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error("No se pudo iniciar sesión con Google"); return; }
    if (r.redirected) return;
    nav({ to: "/dashboard" });
  }

  return (
    <div className="console-grid flex min-h-screen items-center justify-center bg-background p-4">
      <div className="tile w-full max-w-sm p-6">
        <Brand />
        <h1 className="mt-6 text-2xl font-semibold">
          {mode === "login" ? "Ingresar" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Plataforma gratuita para equipos de adoración y producción.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw">Contraseña</Label>
              <Input id="pw" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          {notice && <p className="rounded-md bg-lime/10 p-3 text-sm text-lime">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "Ingresar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
          </Button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />o<div className="h-px flex-1 bg-border" /></div>
            <Button variant="secondary" className="w-full" onClick={google}>Continuar con Google</Button>
          </>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
          {mode !== "login" ? (
            <button className="text-cyan" onClick={() => setMode("login")}>Ya tengo cuenta</button>
          ) : (
            <button className="text-cyan" onClick={() => setMode("signup")}>Crear cuenta</button>
          )}
          {mode === "login" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>¿Olvidaste tu contraseña?</button>}
        </div>
      </div>
    </div>
  );
}
