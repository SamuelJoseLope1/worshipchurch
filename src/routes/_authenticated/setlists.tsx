import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSetlist, useSetlists, useSongs } from "@/lib/data";
import { useInvalidate, useOrg } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/setlists")({
  head: () => ({
    meta: [
      { title: "Setlists — Worship Church Multitrack Player" },
      { name: "description", content: "Planifica las alabanzas de cada culto." },
      { property: "og:title", content: "Setlists — Worship Church Multitrack Player" },
      { property: "og:description", content: "Planifica las alabanzas de cada culto." },
    ],
  }),
  component: Setlists,
});

function nextCult() {
  const d = new Date();
  while (![2, 5, 6, 0].includes(d.getDay())) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function Setlists() {
  const { orgId, can } = useOrg();
  const lists = useSetlists();
  const inv = useInvalidate();
  const [sel, setSel] = useState<string | null>(null);
  const create = async () => {
    const date = nextCult();
    const { data, error } = await supabase.from("setlists").insert({ org_id: orgId!, name: `Culto ${date}`, service_date: date }).select().single();
    if (error) { toast.error(error.message); return; }
    inv("setlists"); setSel(data.id);
  };
  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        {can("edit") && <Button className="w-full" onClick={create}>+ Nuevo setlist</Button>}
        {(lists.data ?? []).map((s) => (
          <button key={s.id} onClick={() => setSel(s.id)} className={`w-full rounded-md border px-3 py-2 text-left ${sel === s.id ? "border-primary bg-secondary" : "border-border bg-card"}`}>
            <div className="font-medium">{s.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{s.setlist_items.length} canciones</div>
          </button>
        ))}
      </aside>
      {sel ? <Detail id={sel} onDeleted={() => setSel(null)} /> : <p className="text-muted-foreground">Selecciona o crea un setlist.</p>}
    </div>
  );
}

function Detail({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { orgId, can } = useOrg();
  const sl = useSetlist(id);
  const songs = useSongs();
  const inv = useInvalidate();
  const [add, setAdd] = useState("");
  const items = sl.data?.items ?? [];
  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (error) toast.error(error.message);
    inv("setlists");
  };
  const move = async (i: number, d: number) => {
    const a = items[i], b = items[i + d];
    if (!a || !b) return;
    await run(supabase.from("setlist_items").update({ position: b.position }).eq("id", a.id));
    await run(supabase.from("setlist_items").update({ position: a.position }).eq("id", b.id));
  };
  if (!sl.data) return <p className="text-muted-foreground">Cargando…</p>;
  const total = items.reduce((t, it) => t + Number(it.songs?.duration_sec ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" defaultValue={sl.data.name} disabled={!can("edit")} onBlur={(e) => run(supabase.from("setlists").update({ name: e.target.value }).eq("id", id))} />
        <Input type="date" className="w-44" defaultValue={sl.data.service_date?.slice(0, 10) ?? ""} disabled={!can("edit")} onChange={(e) => run(supabase.from("setlists").update({ service_date: e.target.value || null }).eq("id", id))} />
        {can("delete") && <Button variant="destructive" onClick={async () => { if (confirm("¿Eliminar setlist?")) { await run(supabase.from("setlists").delete().eq("id", id)); onDeleted(); } }}>Eliminar</Button>}
      </div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <span className="font-mono text-amber">{i + 1}</span>
            <span className="flex-1 font-medium">{it.songs?.title}</span>
            <span className="font-mono text-xs text-muted-foreground">{it.songs?.song_key} · {Number(it.songs?.bpm)} BPM</span>
            {can("edit") && <>
              <Button size="sm" variant="outline" onClick={() => move(i, -1)}>↑</Button>
              <Button size="sm" variant="outline" onClick={() => move(i, 1)}>↓</Button>
              <Button size="sm" variant="outline" onClick={() => run(supabase.from("setlist_items").delete().eq("id", it.id))}>✕</Button>
            </>}
          </li>
        ))}
      </ol>
      {total > 0 && <p className="font-mono text-xs text-muted-foreground">Duración estimada: {Math.round(total / 60)} min</p>}
      {can("edit") && (
        <div className="flex gap-2">
          <select className="flex-1 rounded-md border border-input bg-background px-2" value={add} onChange={(e) => setAdd(e.target.value)}>
            <option value="">Agregar canción…</option>
            {(songs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <Button disabled={!add} onClick={async () => { await run(supabase.from("setlist_items").insert({ org_id: orgId!, setlist_id: id, song_id: add, position: (items.at(-1)?.position ?? 0) + 1 })); setAdd(""); }}>Agregar</Button>
        </div>
      )}
    </div>
  );
}
