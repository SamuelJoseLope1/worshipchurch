import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSongs, useStems } from "@/lib/data";
import { useInvalidate, useOrg } from "@/lib/org";
import { engine, useEngine } from "@/lib/audio/useEngine";
import { formatTime, SECTION_TYPES } from "@/lib/music";
import { asArr, uid, type Marker } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/daw")({
  head: () => ({
    meta: [
      { title: "Editor DAW — Worship Church Multitrack Player" },
      { name: "description", content: "Edita secciones, marcadores y mezcla de tus multitracks." },
      { property: "og:title", content: "Editor DAW — Worship Church Multitrack Player" },
      { property: "og:description", content: "Edita secciones, marcadores y mezcla de tus multitracks." },
    ],
  }),
  component: Daw,
});

const LABEL_W = 140;

function Daw() {
  const { can } = useOrg();
  const songs = useSongs();
  const [songId, setSongId] = useState("");
  const stems = useStems(songId || null);
  const inv = useInvalidate();
  const e = useEngine();
  const song = songs.data?.find((s) => s.id === songId);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [zoom, setZoom] = useState(20); // px por segundo
  const [drag, setDrag] = useState<number | null>(null);

  useEffect(() => setMarkers(asArr<Marker>(song?.markers).sort((a, b) => a.time - b.time)), [song?.id]);
  useEffect(() => {
    if (!song || !stems.data?.length || e.songId === song.id) return;
    void engine.loadSong({
      songId: song.id, bpm: Number(song.bpm), originalBpm: Number(song.bpm), timeSig: song.time_signature,
      stems: stems.data.map((s) => ({ id: s.id, name: s.name, type: s.stem_type, group: s.group_name, color: s.color, path: s.storage_path, volume: Number(s.volume), pan: Number(s.pan), muted: s.muted, output: s.output })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, stems.data]);

  const loaded = !!song && e.songId === song.id;
  const width = Math.max(600, (e.duration || 60) * zoom);
  const timeAt = (ev: React.MouseEvent) => {
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.max(0, (ev.clientX - r.left) / zoom);
  };

  const addMarker = () => setMarkers((m) => [...m, { id: uid(), time: e.position, name: "Coro", type: "Section" as const, color: "amber" }].sort((a, b) => a.time - b.time));
  const save = async () => {
    if (!song) return;
    const { error } = await supabase.from("songs").update({ markers }).eq("id", song.id);
    if (error) { toast.error(error.message); return; }
    for (const s of e.stems) await supabase.from("stems").update({ volume: s.volume, pan: s.pan, muted: s.muted, output: s.output ?? "main" }).eq("id", s.id);
    toast.success("Cambios guardados: el reproductor ya usa esta versión"); inv("songs"); inv("stems");
  };

  // Atajos: espacio = play/pausa, M = marcador
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).tagName === "INPUT" || (ev.target as HTMLElement).tagName === "SELECT") return;
      if (ev.code === "Space") { ev.preventDefault(); e.playing ? engine.pause() : engine.play(); }
      if (ev.key === "m") addMarker();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-10 min-w-64 rounded-md border border-input bg-background px-2" value={songId} onChange={(ev) => setSongId(ev.target.value)}>
          <option value="">Elige una canción…</option>
          {(songs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        {song && !stems.data?.length && <span className="text-sm text-muted-foreground">Sube pistas en el Mezclador primero.</span>}
      </div>

      {loaded && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
            <Button onClick={() => (e.playing ? engine.pause() : engine.play())}>{e.playing ? "Pausa" : "Play"}</Button>
            <Button variant="outline" onClick={() => engine.stop()}>Stop</Button>
            <span className="font-mono text-xl text-amber">{formatTime(e.position)}</span>
            <span className="font-mono text-xs text-muted-foreground">/ {formatTime(e.duration)} · {e.bpm} BPM</span>
            <Button size="sm" variant={e.loop.enabled ? "default" : "outline"} onClick={() => engine.setLoop({ enabled: !e.loop.enabled })}>Loop {e.loop.b > e.loop.a ? `${formatTime(e.loop.a)}–${formatTime(e.loop.b)}` : ""}</Button>
            {can("edit") && <Button size="sm" variant="outline" onClick={addMarker}>+ Marcador (M)</Button>}
            <span className="ml-auto text-xs text-muted-foreground">Zoom</span>
            <input type="range" min={5} max={120} value={zoom} onChange={(ev) => setZoom(Number(ev.target.value))} />
            {can("edit") && <Button onClick={save}>Guardar</Button>}
          </div>
          <p className="text-xs text-muted-foreground">Clic en la regla para moverte · arrastra en la regla para crear un loop · espacio = play/pausa.</p>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <div style={{ width: width + LABEL_W }} className="relative">
              {/* Regla + marcadores */}
              <div className="flex border-b border-border">
                <div style={{ width: LABEL_W }} className="shrink-0 p-1 font-mono text-[10px] text-muted-foreground">SECCIONES</div>
                <div
                  className="relative h-12 cursor-pointer select-none"
                  style={{ width }}
                  onMouseDown={(ev) => setDrag(timeAt(ev))}
                  onMouseUp={(ev) => {
                    const t = timeAt(ev);
                    if (drag !== null && Math.abs(t - drag) > 0.3) engine.setLoop({ a: Math.min(t, drag), b: Math.max(t, drag), enabled: true });
                    else engine.seek(t);
                    setDrag(null);
                  }}
                >
                  {Array.from({ length: Math.ceil(e.duration || 60) }, (_, i) => i).filter((i) => i % (zoom < 15 ? 10 : 5) === 0).map((i) => (
                    <span key={i} className="absolute top-0 font-mono text-[9px] text-muted-foreground" style={{ left: i * zoom }}>{formatTime(i)}</span>
                  ))}
                  {e.loop.b > e.loop.a && <div className={`absolute bottom-0 h-2 ${e.loop.enabled ? "bg-primary/60" : "bg-muted"}`} style={{ left: e.loop.a * zoom, width: (e.loop.b - e.loop.a) * zoom }} />}
                  {markers.map((m) => (
                    <div key={m.id} className="absolute top-3 flex items-center" style={{ left: m.time * zoom }} onMouseDown={(ev) => ev.stopPropagation()} onMouseUp={(ev) => { ev.stopPropagation(); engine.seek(m.time); }}>
                      <div className="h-6 w-0.5 bg-amber" />
                      <span className="rounded-r bg-amber px-1 text-[10px] font-semibold text-background">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pistas */}
              {e.stems.map((s) => (
                <div key={s.id} className="flex border-b border-border">
                  <div style={{ width: LABEL_W }} className="shrink-0 space-y-1 p-1">
                    <div className="truncate text-xs font-medium" title={s.name}>{s.name}</div>
                    <div className="flex gap-1">
                      <button className={`rounded px-1.5 text-[10px] font-bold ${s.muted ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`} onClick={() => engine.setStem(s.id, { muted: !s.muted })}>M</button>
                      <button className={`rounded px-1.5 text-[10px] font-bold ${s.solo ? "bg-amber text-background" : "bg-secondary"}`} onClick={() => engine.setStem(s.id, { solo: !s.solo })}>S</button>
                      <input type="range" min={0} max={1} step={0.01} value={s.volume} className="w-16" onChange={(ev) => engine.setStem(s.id, { volume: Number(ev.target.value) })} />
                    </div>
                  </div>
                  <Wave id={s.id} width={width} ready={s.status === "ready"} muted={s.muted} onSeek={(t) => engine.seek(t)} zoom={zoom} />
                </div>
              ))}
              {/* Cursor */}
              <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary" style={{ left: LABEL_W + e.position * zoom }} />
            </div>
          </div>

          {markers.length > 0 && (
            <div className="space-y-1">
              <div className="font-mono text-xs uppercase text-amber">Marcadores / secciones</div>
              {markers.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <button className="w-14 font-mono text-xs text-primary" onClick={() => engine.seek(m.time)}>{formatTime(m.time)}</button>
                  <select className="rounded border border-input bg-background px-1" value={SECTION_TYPES.includes(m.name as never) ? m.name : "Custom"} disabled={!can("edit")} onChange={(ev) => setMarkers((all) => all.map((x) => (x.id === m.id ? { ...x, name: ev.target.value } : x)))}>
                    {SECTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input className="rounded border border-input bg-background px-2 py-0.5" value={m.name} disabled={!can("edit")} onChange={(ev) => setMarkers((all) => all.map((x) => (x.id === m.id ? { ...x, name: ev.target.value } : x)))} />
                  <Button size="sm" variant="outline" onClick={() => setMarkers((all) => all.map((x) => (x.id === m.id ? { ...x, time: e.position } : x)).sort((a, b) => a.time - b.time))}>Mover aquí</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const next = markers.find((x) => x.time > m.time);
                    engine.setLoop({ a: m.time, b: next?.time ?? e.duration, enabled: true });
                  }}>Loop sección</Button>
                  {can("edit") && <Button size="sm" variant="outline" onClick={() => setMarkers((all) => all.filter((x) => x.id !== m.id))}>✕</Button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Wave({ id, width, ready, muted, zoom, onSeek }: { id: string; width: number; ready: boolean; muted: boolean; zoom: number; onSeek: (t: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !ready) return;
    const w = Math.min(width, 16000);
    c.width = w; c.height = 56;
    const g = c.getContext("2d")!;
    const p = engine.peaks(id, w);
    g.clearRect(0, 0, w, 56);
    g.fillStyle = getComputedStyle(c).color;
    if (p) for (let i = 0; i < w; i++) { const h = Math.max(1, p[i]! * 54); g.fillRect(i, 28 - h / 2, 1, h); }
  }, [id, width, ready]);
  return (
    <div className="relative h-14" style={{ width }} onClick={(ev) => { const r = ev.currentTarget.getBoundingClientRect(); onSeek((ev.clientX - r.left) / zoom); }}>
      {ready ? <canvas ref={ref} className={`h-14 ${muted ? "text-muted-foreground/40" : "text-primary"}`} style={{ width }} /> : <span className="p-2 text-xs text-amber">Cargando…</span>}
    </div>
  );
}
