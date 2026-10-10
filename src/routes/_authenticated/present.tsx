import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSongs } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME, displayChannel, openDisplayWindow } from "@/lib/services/presentation";

export const Route = createFileRoute("/_authenticated/present")({
  head: () => ({
    meta: [
      { title: "Proyección — Worship Church Multitrack Player" },
      { name: "description", content: "Controla las letras en el proyector con una cuadrícula de diapositivas." },
      { property: "og:title", content: "Proyección — Worship Church" },
      { property: "og:description", content: "Cuadrícula de diapositivas para proyectar letras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Present,
});

const CHORD = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add)?\d*(\/[A-G][#b]?)?$/;
function slides(lyrics: string) {
  const out: { section: string; lines: string[] }[] = [];
  let section = "";
  let cur: string[] = [];
  const push = () => { if (cur.length) out.push({ section, lines: cur }); cur = []; };
  for (const raw of lyrics.split("\n")) {
    if (raw.startsWith("#")) { push(); section = raw.replace(/^#+\s*/, ""); continue; }
    const l = raw.replace(/\[[^\]]*\]/g, "").trim();
    const words = l.split(/\s+/).filter(Boolean);
    if (!l) { push(); continue; }
    if (words.every((w) => CHORD.test(w))) continue;
    cur.push(l);
    if (cur.length === 4) push();
  }
  push();
  return out;
}

function Present() {
  const songs = useSongs();
  const [songId, setSongId] = useState("");
  const [idx, setIdx] = useState(-1);
  const [size, setSize] = useState(DEFAULT_THEME.size);
  const ch = useRef<BroadcastChannel | null>(null);
  useEffect(() => { ch.current = displayChannel(); return () => ch.current?.close(); }, []);
  const song = songs.data?.find((s) => s.id === songId);
  const list = useMemo(() => slides(song?.lyrics ?? ""), [song?.lyrics]);
  const theme = { ...DEFAULT_THEME, size };

  const show = (i: number) => {
    const s = list[i];
    if (!s) return;
    setIdx(i);
    ch.current?.postMessage({ type: "slide", title: song?.title ?? "", section: s.section, lines: s.lines, theme });
  };
  const blank = () => { setIdx(-1); ch.current?.postMessage({ type: "blank", theme }); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); show(Math.min(list.length - 1, idx + 1)); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") show(Math.max(0, idx - 1));
      if (e.key === "b" || e.key === "Escape") blank();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-10 min-w-64 rounded-md border border-input bg-background px-2" value={songId} onChange={(e) => { setSongId(e.target.value); setIdx(-1); }}>
          <option value="">Elige una canción…</option>
          {(songs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <Button variant="outline" onClick={() => openDisplayWindow()}>Abrir pantalla</Button>
        <Button size="lg" variant="destructive" onClick={blank}>Ocultar (B)</Button>
        <label className="flex items-center gap-2 text-xs">Tamaño<input type="range" min={28} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
      </div>
      <p className="text-xs text-muted-foreground">Arrastra la ventana de pantalla al proyector y haz doble clic para pantalla completa. Flechas, espacio o pedal para avanzar.</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {list.map((s, i) => (
          <button key={i} onClick={() => show(i)} className={`min-h-28 rounded-lg border p-2 text-left text-sm ${i === idx ? "border-amber bg-amber/10" : "border-border bg-card hover:border-primary"}`}>
            <div className="mb-1 font-mono text-[10px] text-cyan">{i + 1}{s.section ? ` · ${s.section}` : ""}</div>
            {s.lines.map((l, j) => <div key={j} className="truncate">{l}</div>)}
          </button>
        ))}
        {song && !list.length && <p className="text-sm text-muted-foreground">Esta canción no tiene letra.</p>}
      </div>
    </div>
  );
}
