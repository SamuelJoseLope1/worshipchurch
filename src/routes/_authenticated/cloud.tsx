import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidate, useOrg } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { storage, safeName } from "@/lib/services/storage";
import { AUDIO_EXT, colorFor, detectStemType, groupFor } from "@/lib/stems";

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

  const bulk = async (files: { path: string; blob: Blob }[]) => {
    if (!orgId) return;
    const audio = files.filter((f) => AUDIO_EXT.test(f.path) && !f.path.includes("__MACOSX"));
    if (!audio.length) { toast.error("No se encontraron archivos de audio"); return; }
    const parts = audio.map((f) => f.path.split("/").filter(Boolean));
    const strip = parts.every((p) => p.length > 2 && p[0] === parts[0]?.[0]) ? 1 : 0;
    const groups = new Map<string, { name: string; blob: Blob }[]>();
    audio.forEach((f, i) => {
      const p = parts[i].slice(strip);
      const song = (p.length > 1 ? p[0] : undefined) ?? "Sin carpeta";
      if (!groups.has(song)) groups.set(song, []);
      groups.get(song)!.push({ name: p[p.length - 1] ?? "pista", blob: f.blob });
    });
    let n = 0;
    for (const [title, tracks] of groups) {
      setBusy(`Subiendo ${++n}/${groups.size}: ${title}`);
      const { data: s, error } = await supabase.from("songs").insert({ org_id: orgId, title, shared: true }).select("id").single();
      if (error) { toast.error(`${title}: ${error.message}`); continue; }
      await Promise.all(tracks.map(async (t, i) => {
        const path = `${orgId}/stems/${s.id}/${Date.now()}_${i}_${safeName(t.name)}`;
        try {
          await storage.upload(path, t.blob, t.blob.type || "audio/mpeg");
          const ty = detectStemType(t.name);
          await supabase.from("stems").insert({ org_id: orgId, song_id: s.id, name: t.name.replace(/\.[^.]+$/, ""), stem_type: ty, group_name: groupFor(ty), color: colorFor(ty), storage_path: path, file_name: t.name, file_size: t.blob.size, sort_order: i });
        } catch (e) { toast.error(`${t.name}: ${(e as Error).message}`); }
      }));
    }
    setBusy("");
    inv("songs"); list.refetch();
    toast.success(`${groups.size} canciones subidas a la Nube`);
  };

  const fromZip = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.zip$/i.test(f.name)) return toast.error("Solo ZIP. Los RAR conviértelos a ZIP o sube la carpeta.");
    setBusy("Descomprimiendo…");
    const { unzipSync } = await import("fflate");
    const out = unzipSync(new Uint8Array(await f.arrayBuffer()));
    await bulk(Object.entries(out).filter(([, d]) => d.length).map(([path, d]) => ({ path, blob: new Blob([d as BlobPart]) })));
  };

  const items = (list.data ?? []).filter((s) => `${s.title} ${s.artist ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-mono text-2xl text-amber">Nube de Multitracks</h1>
        <p className="text-sm text-muted-foreground">Sube un ZIP o una carpeta: cada subcarpeta se vuelve una canción con sus pistas, ya publicada en la Nube. Otros la guardan en su iglesia sin volver a subir.</p>
      </div>
      {can("edit") && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm hover:border-primary">
            Subir ZIP
            <input type="file" accept=".zip" className="hidden" onChange={(e) => fromZip(e.target.files?.[0])} />
          </label>
          <label className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm hover:border-primary">
            Subir carpeta
            <input type="file" multiple className="hidden" {...({ webkitdirectory: "" } as object)} onChange={(e) => bulk([...(e.target.files ?? [])].map((f) => ({ path: f.webkitRelativePath || f.name, blob: f })))} />
          </label>
          {busy && !busy.match(/^[0-9a-f-]{36}$/) && <span className="font-mono text-xs text-amber">{busy}</span>}
        </div>
      )}
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
