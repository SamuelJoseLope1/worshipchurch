import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org";
import { useSongs } from "@/lib/data";
import { engine, useEngine } from "@/lib/audio/useEngine";
import { formatTime } from "@/lib/music";
import { asArr, type Marker } from "@/lib/types";
import { deviceKind, makeCode, openSessionChannel, type RemoteCommand, type SessionState } from "@/lib/services/realtime";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/remote")({
  head: () => ({
    meta: [
      { title: "Control Remoto — Worship Church Multitrack Player" },
      { name: "description", content: "Controla la reproducción desde tu teléfono con un código de sesión." },
      { property: "og:title", content: "Control Remoto — Worship Church" },
      { property: "og:description", content: "Controla la reproducción con un código de sesión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Remote,
});

function Remote() {
  const [mode, setMode] = useState<"" | "host" | "ctrl">("");
  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl text-amber">Control Remoto</h1>
      <div className="flex gap-2">
        <Button size="lg" variant={mode === "host" ? "default" : "outline"} onClick={() => setMode("host")}>Este equipo reproduce</Button>
        <Button size="lg" variant={mode === "ctrl" ? "default" : "outline"} onClick={() => setMode("ctrl")}>Controlar con código</Button>
      </div>
      {mode === "host" && <Host />}
      {mode === "ctrl" && <Ctrl />}
    </div>
  );
}

function Host() {
  const { orgId } = useOrg();
  const songs = useSongs();
  const e = useEngine();
  const [code] = useState(makeCode);
  const [status, setStatus] = useState("Conectando…");
  const [devices, setDevices] = useState(0);
  const ch = useRef<RealtimeChannel | null>(null);
  const song = songs.data?.find((s) => s.id === e.songId);
  const markers = asArr<Marker>(song?.markers).filter((m) => m.type === "Section").sort((a, b) => a.time - b.time);
  const cur = [...markers].reverse().find((m) => m.time <= e.position + 0.05);

  useEffect(() => {
    if (orgId) void supabase.from("live_sessions").insert({ org_id: orgId, code, name: `Sesión ${code}` });
    ch.current = openSessionChannel(code, { device: deviceKind(), role: "director", name: "Reproductor", joinedAt: Date.now() }, {
      onStatus: (s) => setStatus(s === "SUBSCRIBED" ? "Conectado" : s),
      onPresence: (l) => setDevices(l.filter((d) => d.role === "remote").length),
      onCommand: (c: RemoteCommand) => {
        const ms = markersRef.current;
        const pos = engine.snapshot?.()?.position ?? 0;
        if (c.type === "play") engine.play();
        else if (c.type === "pause") engine.pause();
        else if (c.type === "stop") engine.stop();
        else if (c.type === "tempo") engine.setBpm((engine.snapshot?.()?.bpm ?? 120) + c.delta);
        else if (c.type === "jump") { const m = ms.find((x) => x.name === c.section); if (m) engine.seek(m.time); }
        else if (c.type === "nextSection") { const m = ms.find((x) => x.time > pos + 0.1); if (m) engine.seek(m.time); }
        else if (c.type === "prevSection") { const m = [...ms].reverse().find((x) => x.time < pos - 1); engine.seek(m?.time ?? 0); }
      },
    });
    return () => { void ch.current?.unsubscribe(); void supabase.from("live_sessions").update({ active: false }).eq("code", code); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markersRef = useRef(markers);
  markersRef.current = markers;

  useEffect(() => {
    const st: SessionState = {
      songTitle: song?.title ?? null, songId: e.songId ?? null, playing: e.playing, position: e.position, duration: e.duration,
      bpm: e.bpm, key: song?.song_key ?? "", section: cur?.name ?? null, nextSection: null, loop: false,
      setlist: markers.map((m) => ({ id: m.id, title: m.name })), updatedAt: Date.now(),
    };
    void ch.current?.send({ type: "broadcast", event: "state", payload: st });
  }, [e.playing, Math.floor(e.position), e.songId, e.bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="font-mono text-6xl tracking-widest text-amber">{code}</div>
      <p className="text-sm">Abre "Control Remoto → Controlar con código" en tu teléfono e ingresa este código.</p>
      <p className="font-mono text-xs text-muted-foreground">{status} · {devices} control(es) conectado(s)</p>
      {!e.songId && <p className="text-sm text-amber">Carga una canción en el Mezclador primero; sigue sonando aunque cambies de página.</p>}
    </div>
  );
}

function Ctrl() {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState("");
  const [st, setSt] = useState<SessionState | null>(null);
  const [status, setStatus] = useState("");
  const ch = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (!joined) return;
    ch.current = openSessionChannel(joined, { device: deviceKind(), role: "remote", name: "Control", joinedAt: Date.now() }, {
      onState: setSt, onStatus: (s) => setStatus(s === "SUBSCRIBED" ? "Conectado" : s),
    });
    return () => { void ch.current?.unsubscribe(); };
  }, [joined]);
  const send = (c: RemoteCommand) => void ch.current?.send({ type: "broadcast", event: "cmd", payload: c });

  if (!joined) return (
    <div className="flex gap-2">
      <input inputMode="numeric" maxLength={4} className="h-14 w-40 rounded-md border border-input bg-background px-3 text-center font-mono text-3xl" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="0000" />
      <Button size="lg" className="h-14" disabled={code.length !== 4} onClick={() => setJoined(code)}>Conectar</Button>
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted-foreground">Sesión {joined} · {status} {!st && "· esperando al reproductor…"}</p>
      {st && <div className="rounded-lg border border-border bg-card p-3"><div className="text-lg font-semibold">{st.songTitle ?? "Sin canción"}</div><div className="font-mono text-amber">{formatTime(st.position)} / {formatTime(st.duration)} · {st.bpm} BPM · {st.section ?? "—"}</div></div>}
      <div className="grid grid-cols-3 gap-2">
        <Button className="h-20 text-xl" onClick={() => send({ type: "prevSection" })}>◀ Sección</Button>
        <Button className="h-20 text-xl" variant={st?.playing ? "outline" : "default"} onClick={() => send({ type: st?.playing ? "pause" : "play" })}>{st?.playing ? "Pausa" : "Play"}</Button>
        <Button className="h-20 text-xl" onClick={() => send({ type: "nextSection" })}>Sección ▶</Button>
        <Button className="h-16" variant="outline" onClick={() => send({ type: "tempo", delta: -1 })}>BPM −</Button>
        <Button className="h-16" variant="destructive" onClick={() => send({ type: "stop" })}>Stop</Button>
        <Button className="h-16" variant="outline" onClick={() => send({ type: "tempo", delta: 1 })}>BPM +</Button>
      </div>
      {!!st?.setlist.length && <div className="flex flex-wrap gap-2">{st.setlist.map((m) => <Button key={m.id} variant={st.section === m.title ? "default" : "outline"} className="h-14" onClick={() => send({ type: "jump", section: m.title })}>{m.title}</Button>)}</div>}
    </div>
  );
}
