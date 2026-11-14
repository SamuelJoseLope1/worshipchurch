import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Minus, Plus, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSongs } from '@/lib/data';
import { useEngine } from '@/lib/audio/useEngine';
import { chordLine, parseLyrics, transposeLyrics, transposeChord } from '@/lib/music';

export const Route = createFileRoute('/_authenticated/lyrics')({
  validateSearch: (search: Record<string, unknown>): { song?: string } => {
    const song = search['song'];
    return typeof song === 'string' ? { song } : {};
  },
  head: () => ({ meta: [
    { title: 'Letras y acordes — Worship Church' },
    { name: 'description', content: 'Letras, acordes y transposición de tus canciones para el equipo de alabanza.' },
    { property: 'og:title', content: 'Letras y acordes — Worship Church' },
    { property: 'og:description', content: 'Consulta las letras y los acordes de las canciones de tu iglesia.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: LyricsPage,
});

function LyricsPage() {
  const songs = useSongs();
  const e = useEngine();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [semitones, setSemitones] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const songId = search.song ?? e.songId ?? songs.data?.[0]?.id;
  const song = songs.data?.find(s => s.id === songId);
  const sections = parseLyrics(transposeLyrics(song?.lyrics ?? '', semitones));

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold"><Music2 className="size-5 text-cyan" />Letras y acordes</h1>
      <Button asChild variant="outline"><Link to="/mixer">Volver al mezclador</Link></Button>
    </header>
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label="Canción de letras y acordes" className="h-10 w-full max-w-md rounded border border-input bg-background px-2" value={songId ?? ''} onChange={ev => { setSemitones(0); void navigate({ search: { song: ev.target.value } }); }}>
        <option value="">Elige una canción…</option>
        {(songs.data ?? []).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      {song && <>
        <Button variant={showChords ? 'secondary' : 'outline'} aria-pressed={showChords} onClick={() => setShowChords(!showChords)}>Acordes</Button>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Bajar tono" disabled={semitones <= -12} onClick={() => setSemitones(s => s - 1)}><Minus /></Button>
          <output className="min-w-20 text-center font-mono text-cyan">{transposeChord(song.song_key, semitones)} · {semitones > 0 ? '+' : ''}{semitones}</output>
          <Button size="icon" variant="outline" aria-label="Subir tono" disabled={semitones >= 12} onClick={() => setSemitones(s => s + 1)}><Plus /></Button>
        </div>
      </>}
    </div>
    {songs.isPending ? <p className="text-muted-foreground">Cargando canciones…</p> : songs.isError ? <p className="text-destructive">No se pudieron cargar las canciones.</p> : !song ? <p className="text-muted-foreground">No hay canción seleccionada.</p> : <>
      <h2 className="text-2xl font-semibold">{song.title}</h2>
      {!sections.length && <p className="text-muted-foreground">Esta canción no tiene letra ni acordes guardados.</p>}
      <div className="space-y-8">
        {sections.map((section, i) => <section key={i} className="border-t border-border pt-4">
          <h3 className="mb-4 font-mono text-sm font-semibold uppercase text-amber">{section.name}</h3>
          {section.lines.map((line, j) => <div key={j} className="mb-3 overflow-x-auto font-mono text-base sm:text-lg">
            {showChords && line.chords.length > 0 && <pre className="text-cyan">{chordLine(line)}</pre>}
            <p className="whitespace-pre-wrap">{line.text || '\u00a0'}</p>
          </div>)}
        </section>)}
      </div>
    </>}
  </div>;
}