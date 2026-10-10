import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidate, useOrg } from "@/lib/org";
import { ROLE_LABEL, type OrgRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración — Worship Church Multitrack Player" },
      { name: "description", content: "Administra tu iglesia, miembros y roles." },
      { property: "og:title", content: "Administración — Worship Church" },
      { property: "og:description", content: "Administra tu iglesia, miembros y roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const ROLES = Object.keys(ROLE_LABEL) as OrgRole[];

function Admin() {
  const { orgId, orgName, userId, can } = useOrg();
  const inv = useInvalidate();
  const [name, setName] = useState(orgName);
  const [newId, setNewId] = useState("");
  const [newRole, setNewRole] = useState<OrgRole>("musician");
  const members = useQuery({
    queryKey: ["members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("organization_members").select("*").eq("org_id", orgId!).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const stats = useQuery({
    queryKey: ["admin-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const c = async (t: "songs" | "stems" | "setlists") => (await supabase.from(t).select("id", { count: "exact", head: true }).eq("org_id", orgId!)).count ?? 0;
      const [songs, stems, setlists] = await Promise.all([c("songs"), c("stems"), c("setlists")]);
      return { songs, stems, setlists };
    },
  });

  if (!can("admin")) return <p className="text-muted-foreground">Solo Owner o Admin pueden ver esta página.</p>;

  const run = async (p: PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await p;
    if (error) toast.error(error.message); else { toast.success(ok); void members.refetch(); inv("memberships"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-2xl text-amber">Administración</h1>
      <div className="grid grid-cols-3 gap-2">
        {[["Canciones", stats.data?.songs], ["Pistas", stats.data?.stems], ["Setlists", stats.data?.setlists]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border border-border bg-card p-3"><div className="font-mono text-3xl text-cyan">{v ?? "…"}</div><div className="text-xs text-muted-foreground">{l}</div></div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Iglesia</h2>
        <div className="flex gap-2">
          <input className="h-10 flex-1 rounded-md border border-input bg-background px-3" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => run(supabase.from("organizations").update({ name }).eq("id", orgId!), "Nombre guardado")}>Guardar</Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Miembros y roles</h2>
        <p className="text-xs text-muted-foreground">Tu código de usuario: <span className="select-all font-mono text-amber">{userId}</span>. Pide a cada músico que te envíe el suyo (lo ve aquí al iniciar sesión) para agregarlo.</p>
        <div className="flex flex-wrap gap-2">
          <input className="h-10 flex-1 rounded-md border border-input bg-background px-3 font-mono text-xs" placeholder="Código de usuario" value={newId} onChange={(e) => setNewId(e.target.value.trim())} />
          <select className="h-10 rounded-md border border-input bg-background px-2" value={newRole} onChange={(e) => setNewRole(e.target.value as OrgRole)}>
            {ROLES.filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <Button disabled={newId.length < 30} onClick={() => run(supabase.from("organization_members").insert({ org_id: orgId!, user_id: newId, role: newRole }), "Miembro agregado").then(() => setNewId(""))}>Agregar</Button>
        </div>
        <ul className="space-y-1">
          {(members.data ?? []).map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className="flex-1 truncate font-mono text-xs">{m.user_id === userId ? "Tú" : m.user_id}</span>
              <select disabled={m.role === "owner" || m.user_id === userId} className="h-9 rounded-md border border-input bg-background px-2" value={m.role} onChange={(e) => run(supabase.from("organization_members").update({ role: e.target.value as OrgRole }).eq("id", m.id), "Rol actualizado")}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              {m.role !== "owner" && m.user_id !== userId && <Button size="sm" variant="outline" onClick={() => confirm("¿Quitar miembro?") && run(supabase.from("organization_members").delete().eq("id", m.id), "Miembro quitado")}>✕</Button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
