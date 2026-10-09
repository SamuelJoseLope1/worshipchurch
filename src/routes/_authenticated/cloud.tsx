import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidate, useOrg } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cloud")({
  head: () => ({
    meta: [
      { title: "Nube de Multitracks — Worship Church Multitrack Player" },
      { name: "description", content: "Biblioteca compartida de multitracks para guardar en tu iglesia sin volver a subir." },
      { property: "og:title", content: "Nube de Multitracks — Worship Church Multitrack Player" },
      { property: "og:description", content: "Biblioteca compartida de multitracks para guardar en tu iglesia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cloud,
});

function Cloud() {
  const { orgId, can } = useOrg();
  const inv = useInvalidate();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const list = useQuery({
    queryKey: ["cloud"],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*, stems(count)").eq("shared", true).order("title");
      if (error) throw error;
      return data;
    },
  });

  const save = async (id: string) => {
    if (!orgId) return;
    setBusy(id);
    try {
      const { data: s } = await supabase.from("songs").select("*").eq("id", id).single();
      const { data: st } = await supabase.from("stems").select("*").eq("song_id", id);
      if (!s) throw new Error("No encontrada");
      const { id: _i, created_at: _c, updated_at: _u, created_by: _b, ...rest } = s;
      const { data: ns, error } = await supabase.from("songs").insert({ ...rest, org_id: orgId, shared: false }).select("id").single();
      if (error) throw error;
      if (st?.length) {
        const rows = st.map(({ id: _x, created_at: _y, ...r }) => ({ ...r, org_id: orgId, song_id: ns.id }));
        const { error: e2 } = await supabase.from("stems").insert(rows);
        if (e2) throw e2;
      }
      inv("songs");
      toast.success("Guardada en tu iglesia");
    } catch (e) { toast.error((e as Error).message); }
    setBusy("");
  };

  const items = (list.data ?? []).filter((s) => `${s.title} ${s.artist ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-mono text-2xl text-amber">Nube de Multitracks</h1>
        <p className="text-sm text-muted-foreground">Canciones compartidas. Guárdalas en tu iglesia sin volver a subir los archivos. Para publicar una, marca "Compartir en la Nube" en el mezclador.</p>
      </div>
      <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!list.isLoading && !items.length && <p className="text-sm text-muted-foreground">Aún no hay canciones en la Nube.</p>}
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <div className="flex-1">
              <div className="font-semibold">{s.title}</div>
              <div className="font-mono text-xs text-muted-foreground">{s.artist ?? "—"} · {s.song_key} · {Number(s.bpm)} BPM · {(s.stems as unknown as { count: number }[])?.[0]?.count ?? 0} pistas</div>
            </div>
            {s.org_id === orgId ? <span className="text-xs text-cyan">Tuya</span> : can("edit") && (
              <Button size="sm" disabled={busy === s.id} onClick={() => save(s.id)}>{busy === s.id ? "Guardando…" : "Guardar en mi iglesia"}</Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
