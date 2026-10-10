import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrgProvider, useOrg } from "@/lib/org";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABEL } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  return (
    <OrgProvider userId={user.id} email={user.email ?? ""}>
      <Shell />
    </OrgProvider>
  );
}

const NAV = [
  { to: "/dashboard", label: "Inicio" },
  { to: "/songs", label: "Canciones" },
  { to: "/setlists", label: "Setlists" },
  { to: "/mixer", label: "Mezclador" },
  { to: "/daw", label: "Editor DAW" },
  { to: "/cloud", label: "Nube" },
  { to: "/present", label: "Proyección" },
  { to: "/remote", label: "Remoto" },
  { to: "/admin", label: "Admin" },
] as const;

function Shell() {
  const { loading, orgId, orgName, role, email } = useOrg();
  const nav = useNavigate();
  if (loading) return <div className="p-8 font-mono text-muted-foreground">Cargando…</div>;
  if (!orgId) return <CreateOrg />;
  return (
    <div className="console-grid min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-3">
        <Brand />
        <nav className="flex gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{orgName} · {role ? ROLE_LABEL[role] : ""}</span>
          <span className="hidden md:inline">{email}</span>
          <Button size="sm" variant="outline" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>Salir</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6"><Outlet /></main>
    </div>
  );
}

function CreateOrg() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("organizations").insert({ name: name.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Iglesia creada");
    qc.invalidateQueries({ queryKey: ["memberships"] });
  };
  return (
    <div className="console-grid flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <Brand />
        <h1 className="text-2xl font-semibold">Crea tu iglesia</h1>
        <p className="text-sm text-muted-foreground">Serás el Owner y podrás invitar a tu equipo.</p>
        <Input placeholder="Nombre de la iglesia" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <Button className="w-full" size="lg" disabled={busy} onClick={submit}>Crear</Button>
      </div>
    </div>
  );
}
