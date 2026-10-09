import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_LYRICS, useSongs } from "@/lib/data";
import { useInvalidate, useOrg } from "@/lib/org";
import { KEYS, chordLine, parseLyrics, semitonesBetween, transposeLyrics } from "@/lib/music";
import type { SongRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchChordPage } from "@/lib/import.functions";
import { chordsOverLyricsToBracket } from "@/lib/chordImport";

export const Route = createFileRoute("/_authenticated/songs")({
  head: () => ({
    meta: [
      { title: "Canciones — Worship Church Multitrack Player" },
      { name: "description", content: "Biblioteca de canciones, letras y acordes." },
      { property: "og:title", content: "Canciones — Worship Church Multitrack Player" },
      { property: "og:description", content: "Biblioteca de canciones, letras y acordes." },
    ],
  }),
  component: Songs,
});

function Songs() {
  const { orgId, can } = useOrg();
  const songs = useSongs();
  const inv = useInvalidate();
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const list = (songs.data ?? []).filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
  const current = songs.data?.find((s) => s.id === sel) ?? null;

  const create = async () => {
    const { data, error } = await supabase.from("songs").insert({ org_id: orgId!, title: "Nueva canción", lyrics: DEMO_LYRICS, song_key: "G", bpm: 72 }).select().single();
    if (error) { toast.error(error.message); return; }
    inv("songs"); setSel(data.id);
  };

  const [imp, setImp] = useState(false);
  const [src, setSrc] = useState("");
  const doImport = async () => {
    try {
      let title = "Canción importada", body = src;
      if (/^https?:\/\//.test(src.trim())) {
        const r = await fetchChordPage({ data: { url: src.trim() } });
        title = r.title || title; body = r.body;
      }
      const lyrics = chordsOverLyricsToBracket(body);
      const first = lyrics.match(/\[([A-G][#b]?m?)/)?.[1] ?? "G";
      const { data, error } = await supabase.from("songs").insert({ org_id: orgId!, title, lyrics, song_key: first.replace(/m$/, ""), bpm: 72 }).select().single();
      if (error) throw error;
      toast.success("Importada"); setImp(false); setSrc(""); inv("songs"); setSel(data.id);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        {can("edit") && <Button className="w-full" onClick={create}>+ Nueva canción</Button>}
        {can("edit") && <Button className="w-full" variant="outline" onClick={() => setImp(!imp)}>Importar acordes</Button>}
        {imp && (
          <div className="space-y-2 rounded-md border border-border bg-card p-2">
            <Textarea className="min-h-[120px] font-mono text-xs" placeholder="Pega el enlace (LaCuerda, CifraClub, Ultimate Guitar…) o el texto con acordes encima de la letra" value={src} onChange={(e) => setSrc(e.target.value)} />
            <Button className="w-full" size="sm" onClick={doImport}>Importar</Button>
          </div>
        )}
        <div className="space-y-1">
          {list.map((s) => (
            <button key={s.id} onClick={() => setSel(s.id)} className={`w-full rounded-md border px-3 py-2 text-left ${sel === s.id ? "border-primary bg-secondary" : "border-border bg-card"}`}>
              <div className="font-medium">{s.title}</div>
              <div className="font-mono text-xs text-muted-foreground">{s.song_key} · {Number(s.bpm)} BPM · {s.time_signature}</div>
            </button>
          ))}
          {!songs.isLoading && !list.length && <p className="text-sm text-muted-foreground">Sin canciones todavía.</p>}
        </div>
      </aside>
      {current ? <Editor key={current.id} song={current} onDeleted={() => setSel(null)} /> : <p className="text-muted-foreground">Selecciona o crea una canción.</p>}
    </div>
  );
}

function Editor({ song, onDeleted }: { song: SongRow; onDeleted: () => void }) {
  const { can } = useOrg();
  const inv = useInvalidate();
  const [f, setF] = useState(song);
  const [viewKey, setViewKey] = useState(song.song_key);
  const [nashville, setNashville] = useState(false);
  useEffect(() => setF(song), [song]);
  const semis = semitonesBetween(f.song_key, viewKey);
  const sections = useMemo(() => parseLyrics(transposeLyrics(f.lyrics, semis)), [f.lyrics, semis]);

  const save = async () => {
    const { error } = await supabase.from("songs").update({ title: f.title, artist: f.artist, song_key: f.song_key, bpm: f.bpm, time_signature: f.time_signature, lyrics: f.lyrics, updated_at: new Date().toISOString() }).eq("id", song.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado"); inv("songs");
  };
  const del = async () => {
    if (!confirm("¿Eliminar canción?")) return;
    const { error } = await supabase.from("songs").delete().eq("id", song.id);
    if (error) { toast.error(error.message); return; }
    inv("songs"); onDeleted();
  };
  const toNash = (c: string) => {
    const deg = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];
    return c.replace(/([A-G](?:#|b)?)/g, (m) => deg[((semitonesBetween(viewKey, m) % 12) + 12) % 12]!);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_90px_90px]">
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} disabled={!can("edit")} />
        <Input placeholder="Artista" value={f.artist ?? ""} onChange={(e) => setF({ ...f, artist: e.target.value })} disabled={!can("edit")} />
        <select className="rounded-md border border-input bg-background px-2" value={f.song_key} onChange={(e) => { setF({ ...f, song_key: e.target.value }); setViewKey(e.target.value); }}>
          {KEYS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <Input type="number" value={Number(f.bpm)} onChange={(e) => setF({ ...f, bpm: Number(e.target.value) })} />
        <Input value={f.time_signature} onChange={(e) => setF({ ...f, time_signature: e.target.value })} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea className="min-h-[420px] font-mono text-sm" value={f.lyrics} onChange={(e) => setF({ ...f, lyrics: e.target.value })} disabled={!can("edit")} />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Ver en:</span>
            <select className="rounded border border-input bg-background px-2 py-1" value={viewKey} onChange={(e) => setViewKey(e.target.value)}>
              {KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <Button size="sm" variant={nashville ? "default" : "outline"} onClick={() => setNashville(!nashville)}>Nashville</Button>
          </div>
          <div className="max-h-[380px] overflow-auto font-mono text-sm">
            {sections.map((s, i) => (
              <div key={i} className="mb-4">
                <div className="mb-1 text-xs uppercase text-amber">{s.name}</div>
                {s.lines.map((l, j) => (
                  <div key={j}>
                    {l.chords.length > 0 && <pre className="text-primary">{nashville ? toNash(chordLine(l)) : chordLine(l)}</pre>}
                    <pre className="whitespace-pre-wrap">{l.text}</pre>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {can("edit") && <Button size="lg" onClick={save}>Guardar</Button>}
        {can("delete") && <Button size="lg" variant="destructive" onClick={del}>Eliminar</Button>}
      </div>
    </div>
  );
}
