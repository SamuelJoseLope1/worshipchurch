import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSongs, useStems } from "@/lib/data";
import { useInvalidate, useOrg } from "@/lib/org";
import { engine, useEngine } from "@/lib/audio/useEngine";
import { storage, safeName, offline } from "@/lib/services/storage";
import { AUDIO_EXT, colorFor, detectStemType, groupFor, STEM_COLOR_BG } from "@/lib/stems";
import { formatTime, KEYS } from "@/lib/music";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StudioFader } from "@/components/mixer/StudioFader";
import { ChannelStrip } from "@/components/mixer/ChannelStrip";
import { ArrangementRibbon } from "@/components/mixer/ArrangementRibbon";

export const Route = createFileRoute("/_authenticated/mixer")({
  head: () => ({
    meta: [
      { title: "Pistas y Mezclador — Worship Church Multitrack Player" },
      { name: "description", content: "Carga multitracks y mezcla cada pista en vivo." },
      { property: "og:title", content: "Pistas y Mezclador — Worship Church Multitrack Player" },
      { property: "og:description", content: "Carga multitracks y mezcla cada pista en vivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Mixer,
});

function Mixer() {
  const { orgId, can } = useOrg();
  const songs = useSongs();
  const [songId, setSongId] = useState("");
  const stems = useStems(songId || null);
  const inv = useInvalidate();
  const e = useEngine();
  const [busy, setBusy] = useState("");
  const song = songs.data?.find((s) => s.id === songId);

  const load = async (list = stems.data) => {
    if (!song || !list?.length) return;
    await engine.loadSong({
      songId: song.id, bpm: Number(song.bpm), originalBpm: Number(song.bpm), timeSig: song.time_signature,
      stems: list.map((s) => ({ id: s.id, name: s.name, type: s.stem_type, group: s.group_name, color: s.color, path: s.storage_path, volume: Number(s.volume), pan: Number(s.pan), muted: s.muted, output: s.output })),
    });
    engine.setPad({ note: song.song_key });
  };

  const upload = async (files: FileList | null) => {
    if (!files || !song || !orgId) return;
    const list = [...files].filter((f) => AUDIO_EXT.test(f.name));
    const base = stems.data?.length ?? 0;
    let done = 0;
    setBusy(`Analizando y subiendo ${list.length} pistas…`);
    await Promise.all(list.map(async (f, idx) => {
      const i = base + idx;
      try {
        const path = `${orgId}/stems/${song.id}/${Date.now()}_${idx}_${safeName(f.name)}`;
        const bytes = await f.arrayBuffer();
        await Promise.all([
          engine.preload(path, bytes.slice(0)),
          offline.put(path, f).catch(() => {}),
          storage.upload(path, f),
        ]);
        const t = detectStemType(f.name);
        const { error } = await supabase.from("stems").insert({
          org_id: orgId, song_id: song.id, name: f.name.replace(/\.[^.]+$/, ""), stem_type: t, group_name: groupFor(t), color: colorFor(t),
          storage_path: path, file_name: f.name, file_size: f.size, mime_type: f.type, sort_order: i,
        });
        if (error) throw error;
      } catch (err) { toast.error(`${f.name}: ${(err as Error).message}`); }
      setBusy(`Subiendo… ${++done}/${list.length}`);
    }));
    setBusy("");
    inv("stems");
    const r = await stems.refetch();
    await load(r.data);
    toast.success("Listo para reproducir");
  };

  const removeStem = async (id: string, path: string | null) => {
    if (!confirm("¿Eliminar pista?")) return;
    if (path) await storage.remove([path]).catch(() => {});
    await supabase.from("stems").delete().eq("id", id);
    inv("stems");
  };

  const saveMix = async () => {
    for (const s of e.stems) await supabase.from("stems").update({ volume: s.volume, pan: s.pan, muted: s.muted, output: s.output ?? "main" }).eq("id", s.id);
    toast.success("Mezcla guardada"); inv("stems");
  };

  const loaded = e.songId === songId && songId;

  // Auto-cargar al elegir canción (como un reproductor de multitracks).
  useEffect(() => {
    if (song && stems.data?.length && e.songId !== song.id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, stems.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-10 min-w-64 rounded-md border border-input bg-background px-2" value={songId} onChange={(ev) => setSongId(ev.target.value)}>
          <option value="">Elige una canción…</option>
          {(songs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        
        {song && can("edit") && (
          <label className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm hover:border-primary">
            + Subir pistas
            <input type="file" multiple accept="audio/*" className="hidden" onChange={(ev) => upload(ev.target.files)} />
          </label>
        )}
        {busy && <span className="font-mono text-xs text-amber">{busy}</span>}
      </div>

      {song && !loaded && (
        <ul className="space-y-1">
          {(stems.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className={`h-3 w-3 rounded-full ${STEM_COLOR_BG[s.color] ?? "bg-cyan"}`} />
              <span className="flex-1">{s.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.stem_type}</span>
              {can("delete") && <Button size="sm" variant="outline" onClick={() => removeStem(s.id, s.storage_path)}>✕</Button>}
            </li>
          ))}
          {stems.data && !stems.data.length && <p className="text-sm text-muted-foreground">Esta canción no tiene pistas. Sube WAV/MP3 (se detecta el instrumento por el nombre).</p>}
        </ul>
      )}

      {loaded && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-sm">
              <button className="px-1" onClick={() => engine.setBpm(e.bpm - 1)}>−</button>
              <span className="w-16 text-center">{e.bpm} BPM</span>
              <button className="px-1" onClick={() => engine.setBpm(e.bpm + 1)}>+</button>
              <span className="ml-1 text-xs text-muted-foreground">{song?.time_signature}</span>
            </div>
            <span className="rounded-md border border-border bg-background px-3 py-1 font-mono text-lg text-amber">{formatTime(e.position)} / {formatTime(e.duration)}</span>
            <div className="mx-auto flex gap-1">
              <Button variant="outline" onClick={() => engine.seek(0)}>⏮ Inicio</Button>
              <Button onClick={() => (e.playing ? engine.pause() : engine.play())}>{e.playing ? "❚❚ Pausa" : "▶ Reproducir"}</Button>
              <Button variant="outline" onClick={() => engine.stop()}>■ Stop</Button>
            </div>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={e.varispeed} onChange={(ev) => engine.setVarispeed(ev.target.checked)} />Velocidad pistas</label>
          </div>

          {song && <ArrangementRibbon key={song.id} song={song} editable={can("edit")} />}
          <OutputDevice channels={e.outputs.channels} sinkId={e.outputs.sinkId} />
          <LyricsPanel lyrics={song?.lyrics ?? ""} />
          {can("edit") && song && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!(song as { shared?: boolean }).shared} onChange={async (ev) => { await supabase.from("songs").update({ shared: ev.target.checked }).eq("id", song.id); inv("songs"); toast.success(ev.target.checked ? "Publicada en la Nube" : "Retirada de la Nube"); }} />Compartir en la Nube de multitracks</label>
          )}
          <div className="flex overflow-x-auto rounded-lg border border-border bg-card">
            {e.stems.map((s) => (
              <ChannelStrip key={s.id} name={s.name} volume={s.volume} pan={s.pan} level={s.level} muted={s.muted} solo={s.solo}
                accent={STEM_COLOR_BG[s.color] ?? "bg-cyan"}
                onVolume={(volume) => engine.setStem(s.id, { volume })} onPan={(pan) => engine.setStem(s.id, { pan })}
                onMute={() => engine.setStem(s.id, { muted: !s.muted })} onSolo={() => engine.setStem(s.id, { solo: !s.solo })}
                footer={<>
                  <OutSelect value={s.output ?? "main"} channels={e.outputs.channels} onChange={(v) => engine.setStemOutput(s.id, v)} />
                  {s.status !== "ready" && <div className="text-[10px] text-amber">{s.status === "loading" ? "Cargando…" : s.error ?? "Sin archivo"}</div>}
                </>} />
            ))}
            <div className="ml-auto flex flex-col justify-center gap-2 border-l border-border px-2">
              <Button size="sm" variant="outline" onClick={() => (e.pad.playing ? engine.padStop() : engine.padPlay())}>{e.pad.playing ? "Pad ■" : "Pad ▶"}</Button>
              <Button size="sm" variant={e.click.enabled ? "default" : "outline"} onClick={() => engine.setClick({ enabled: !e.click.enabled })}>Click</Button>
            </div>
            <ChannelStrip master name="MASTER" volume={e.master} onVolume={(v) => engine.setMaster(v)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
              <div className="font-mono text-xs uppercase text-amber">Click (solo para la banda)</div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><input type="checkbox" checked={e.click.enabled} onChange={(ev) => engine.setClick({ enabled: ev.target.checked })} />Activo</label>
                <input type="range" min={0} max={1} step={0.01} value={e.click.volume} onChange={(ev) => engine.setClick({ volume: Number(ev.target.value) })} />
                <select className="rounded border border-input bg-background px-1" value={e.click.subdivision} onChange={(ev) => engine.setClick({ subdivision: Number(ev.target.value) as 1 | 2 | 4 })}>
                  <option value={1}>Negras</option><option value={2}>Corcheas</option><option value={4}>Semicorcheas</option>
                </select>
                <span className="font-mono text-lg text-primary">{e.click.beat + 1}</span>
                <span className="text-xs text-muted-foreground">Salida</span>
                <OutSelect value={e.outputs.clickOut} channels={e.outputs.channels} onChange={(v) => { engine.setClickOutput(v); localStorage.setItem("wcmp.clickOut", v); }} />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
              <div className="font-mono text-xs uppercase text-amber">Pad</div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant={e.pad.playing ? "default" : "outline"} onClick={() => (e.pad.playing ? engine.padStop() : engine.padPlay())}>{e.pad.playing ? "Detener" : "Tocar"}</Button>
                <select className="rounded border border-input bg-background px-1" value={e.pad.note} onChange={(ev) => engine.setPad({ note: ev.target.value })}>{KEYS.map((k) => <option key={k}>{k}</option>)}</select>
                <select className="rounded border border-input bg-background px-1" value={e.pad.preset} onChange={(ev) => engine.setPad({ preset: ev.target.value as "Cálido" })}>{["Cálido", "Brillante", "Oscuro"].map((k) => <option key={k}>{k}</option>)}</select>
                <input type="range" min={0} max={1} step={0.01} value={e.pad.volume} onChange={(ev) => engine.setPad({ volume: Number(ev.target.value) })} />
              </div>
            </div>
          </div>
          {can("edit") && <Button onClick={saveMix}>Guardar mezcla</Button>}
        </>
      )}
    </div>
  );
}

function OutSelect({ value, channels, onChange }: { value: string; channels: number; onChange: (v: string) => void }) {
  const opts: [string, string][] = [["main", "Master 1-2"]];
  for (let i = 1; i < channels; i += 2) opts.push([`st:${i}`, `Estéreo ${i}-${i + 1}`]);
  for (let i = 1; i <= channels; i++) opts.push([`ch:${i}`, `Mono ${i}`]);
  return (
    <select className="w-full rounded border border-input bg-background px-1 py-0.5 text-[11px]" value={value} onChange={(ev) => onChange(ev.target.value)} title="Salida física">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function OutputDevice({ channels, sinkId }: { channels: number; sinkId: string }) {
  const [devs, setDevs] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("wcmp.clickOut");
    if (saved) engine.setClickOutput(saved);
  }, []);
  const pick = async (id: string) => {
    try { await engine.setOutputDevice(id); localStorage.setItem("wcmp.sink", id); toast.success("Interfaz seleccionada"); }
    catch (err) { toast.error((err as Error).message); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
      <span className="font-mono text-xs uppercase text-amber">Interfaz de audio</span>
      <select className="min-w-56 rounded border border-input bg-background px-2 py-1" value={sinkId} onFocus={async () => !devs.length && setDevs(await engine.listOutputDevices())} onChange={(ev) => pick(ev.target.value)}>
        <option value="">Predeterminada del sistema</option>
        {devs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <span className="font-mono text-xs text-muted-foreground">{channels} salidas detectadas</span>
      {channels <= 2 && <span className="text-xs text-muted-foreground">Si tu interfaz tiene más salidas y solo ves 2, el navegador la está limitando; en la app de escritorio verás todas.</span>}
    </div>
  );
}

const CHORD = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add)?\d*(\/[A-G][#b]?)?$/;
function LyricsPanel({ lyrics }: { lyrics: string }) {
  const [show, setShow] = useState(() => typeof localStorage === "undefined" || localStorage.getItem("showChords") !== "0");
  if (!lyrics.trim()) return null;
  const text = show ? lyrics : lyrics
    .replace(/\[[^\]]*\]/g, "")
    .split("\n")
    .filter((l) => { const t = l.trim().split(/\s+/).filter(Boolean); return !(t.length && t.every((w) => CHORD.test(w))); })
    .join("\n");
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">LETRA</span>
        <Button size="sm" variant={show ? "default" : "outline"} onClick={() => { const v = !show; setShow(v); localStorage.setItem("showChords", v ? "1" : "0"); }}>
          {show ? "Ocultar acordes" : "Ver acordes"}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-sm">{text}</pre>
    </div>
  );
}
