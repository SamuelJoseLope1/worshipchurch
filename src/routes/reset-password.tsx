import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Worship Church Multitrack Player" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta." },
      { property: "og:title", content: "Nueva contraseña" },
      { property: "og:description", content: "Define una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("El enlace expiró o no es válido");
    toast.success("Contraseña actualizada");
    nav({ to: "/dashboard" });
  }
  return (
    <div className="console-grid flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="tile w-full max-w-sm space-y-4 p-6">
        <Brand />
        <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Contraseña</Label>
          <Input id="pw" type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy}>Guardar</Button>
      </form>
    </div>
  );
}
