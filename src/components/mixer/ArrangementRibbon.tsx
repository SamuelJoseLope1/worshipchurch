import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Trash2, Repeat2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { engine, useEngine } from '@/lib/audio/useEngine';
import { supabase } from '@/integrations/supabase/client';
import { asArr, uid, type Marker, type SongRow } from '@/lib/types';
import { barTime, musicalPosition } from '@/lib/mixer-timing';
import { useInvalidate } from '@/lib/org';

const SECTION_COLORS: Record<string, string> = { Intro: 'bg-cyan/20 text-cyan', Verso: 'bg-lime/20 text-lime', Coro: 'bg-amber/20 text-amber', Puente: 'bg-rose/20 text-rose', Final: 'bg-secondary text-foreground' };

export function ArrangementRibbon({ song, editable }: { song: SongRow; editable: boolean }) {
  const e = useEngine();
  const inv = useInvalidate();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('Coro');
  const [bar, setBar] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const bpm = Number(song.bpm);
  const duration = e.duration || Number(song.duration_sec) || 1;
  const secondsPerBar = barTime(2, bpm, song.time_signature);
  const bars = Math.max(1, Math.ceil(duration / secondsPerBar));
  const width = Math.max(640, bars * 48);
  const position = musicalPosition(e.position, bpm, song.time_signature);
  const sections = markers.filter(m => m.type === 'Section').sort((a, b) => a.time - b.time);
  const current = sections.filter(m => m.time <= e.position).at(-1);
  const peakStem = e.stems.find(s => s.status === 'ready');
  useEffect(() => { setMarkers(asArr<Marker>(song.markers)); setDirty(false); setEditing(false); }, [song.id, song.markers]);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const draw = () => {
      c.width = Math.min(width, 16000); c.height = 144;
      const g = c.getContext('2d'); if (!g) return;
      const peaks = peakStem ? engine.peaks(peakStem.id, c.width) : null;
      g.clearRect(0, 0, c.width, 144); g.fillStyle = getComputedStyle(c).color;
      if (peaks) peaks.forEach((peak, i) => { const height = peak * 136; g.fillRect(i, 72 - height / 2, 1, height); });
    };
    draw();
    const observer = new ResizeObserver(draw); observer.observe(c);
    return () => observer.disconnect();
  }, [peakStem?.id, e.duration, width]);
  useEffect(() => {
    const el = scroller.current; if (!el || !e.playing) return;
    const x = e.position / duration * width;
    if (x > el.scrollLeft + el.clientWidth - 70 || x < el.scrollLeft) el.scrollLeft = Math.max(0, x - el.clientWidth / 3);
  }, [position.bar, e.playing, duration, width]);
  const save = async () => {
    setSaving(true);
    try { const { error } = await supabase.from('songs').update({ markers }).eq('id', song.id); if (error) throw error; setDirty(false); inv('songs'); toast.success('Secciones guardadas'); }
    catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };
  return <section className="space-y-2 border-y border-border py-3">
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs text-muted-foreground">COMPÁS · TIEMPO · PULSO</span>
      <output aria-label="Compás actual" className="font-mono text-xl tabular-nums text-cyan">{String(position.bar).padStart(3, '0')}.{position.beat}.{String(position.tick).padStart(3, '0')}</output>
      <span className="text-xs text-amber">{current?.name || 'Inicio'} · {song.time_signature}</span>
      <Button size="sm" variant={e.loop.enabled ? 'default' : 'outline'} title="Repetir sección actual" onClick={() => {
        if (e.loop.enabled) { engine.setLoop({ enabled: false }); return; }
        engine.setLoop({ enabled: true, a: current?.time || 0, b: sections.find(m => m.time > e.position)?.time || duration });
      }}><Repeat2 className="size-4" />Bucle</Button>
      {editable && <>
        <Button size="sm" variant="outline" onClick={() => { setEditing(!editing); setBar(position.bar); }}><Plus className="size-4" />Sección</Button>
        <Button size="sm" variant="outline" disabled={!dirty || saving} onClick={save}><Save className="size-4" />{saving ? 'Guardando…' : 'Guardar secciones'}</Button>
      </>}
    </div>
    <div ref={scroller} className="overflow-x-auto">
      <div className="relative" style={{ width }}>
        <div className="relative h-7 border-b border-border">
          {Array.from({ length: bars }, (_, i) => <Button key={i} variant="ghost" title={`Ir al compás ${i + 1}`} aria-label={`Ir al compás ${i + 1}`} className="absolute top-0 h-7 rounded-none border-l border-border px-1 font-mono text-[10px] text-muted-foreground" style={{ left: i * secondsPerBar / duration * width }} onClick={() => engine.seek(barTime(i + 1, bpm, song.time_signature))}>{i + 1}</Button>)}
        </div>
        <div className="relative h-8 overflow-hidden">
          {sections.map((m, i) => <Button key={m.id} variant="ghost" title={`${m.name}: compás ${musicalPosition(m.time, bpm, song.time_signature).bar}`} className={`absolute top-0 h-8 justify-start overflow-hidden rounded-none border-l border-border px-2 text-xs ${SECTION_COLORS[m.name] || 'bg-cyan/20 text-cyan'}`} style={{ left: m.time / duration * width, width: Math.max(1, ((sections[i + 1]?.time ?? duration) - m.time) / duration * width) }} onClick={() => engine.seek(m.time)}>{m.name}</Button>)}
        </div>
        <div role="slider" tabIndex={0} aria-label="Posición en la forma de onda" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={e.position} className="h-36 cursor-crosshair" onKeyDown={ev => { if (ev.key === 'ArrowRight') engine.seek(Math.min(duration, e.position + secondsPerBar)); if (ev.key === 'ArrowLeft') engine.seek(Math.max(0, e.position - secondsPerBar)); }} onClick={ev => { const r = ev.currentTarget.getBoundingClientRect(); engine.seek((ev.clientX - r.left) / width * duration); }}>
          <canvas ref={canvas} className="h-36 w-full text-cyan" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground" style={{ left: Math.min(width - 1, e.position / duration * width) }} />
      </div>
    </div>
    {editing && editable && <div className="space-y-2">
      <form className="flex flex-wrap items-end gap-2" onSubmit={ev => {
        ev.preventDefault(); const time = barTime(bar, bpm, song.time_signature);
        if (time >= duration) { toast.error('El compás debe estar dentro de la canción'); return; }
        if (sections.some(m => Math.abs(m.time - time) < 0.001)) { toast.error('Ya existe una sección en ese compás'); return; }
        setMarkers(all => [...all, { id: uid(), time, name: name.trim(), type: 'Section', color: 'cyan' }]); setDirty(true);
      }}>
        <label className="text-xs">Sección<input aria-label="Nombre de sección" required value={name} onChange={ev => setName(ev.target.value)} list="section-names" className="block h-9 w-40 rounded border border-input bg-background px-2" /><datalist id="section-names">{['Intro','Verso','Pre-coro','Coro','Puente','Instrumental','Final'].map(s => <option key={s}>{s}</option>)}</datalist></label>
        <label className="text-xs">Compás<input aria-label="Compás de sección" type="number" min={1} max={bars} required value={bar} onChange={ev => setBar(Number(ev.target.value))} className="block h-9 w-20 rounded border border-input bg-background px-2" /></label>
        <Button size="sm">Agregar</Button>
      </form>
      {sections.map(m => <div key={m.id} className="flex flex-wrap items-center gap-2 text-xs">
        <input aria-label={`Nombre ${m.name}`} value={m.name} className="h-8 w-36 rounded border border-input bg-background px-2" onChange={ev => { setMarkers(all => all.map(x => x.id === m.id ? { ...x, name: ev.target.value } : x)); setDirty(true); }} />
        <span>Compás</span><input aria-label={`Compás ${m.name}`} type="number" min={1} max={bars} value={musicalPosition(m.time, bpm, song.time_signature).bar} className="h-8 w-20 rounded border border-input bg-background px-2" onChange={ev => { const time = barTime(Number(ev.target.value), bpm, song.time_signature); if (time >= duration) return; setMarkers(all => all.map(x => x.id === m.id ? { ...x, time } : x)); setDirty(true); }} />
        <Button size="sm" variant="ghost" aria-label={`Eliminar sección ${m.name}`} onClick={() => { setMarkers(all => all.filter(x => x.id !== m.id)); setDirty(true); }}><Trash2 className="size-3" /></Button>
      </div>)}
    </div>}
  </section>;
}