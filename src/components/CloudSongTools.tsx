import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Download, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useStems } from '@/lib/data';
import { useOrg, useInvalidate } from '@/lib/org';
import { isOwnerEmail } from '@/lib/owner';
import { manageCloudSong } from '@/lib/cloud-management.functions';
import { deliverFile, prepareSongArchive, prepareStem } from '@/lib/services/downloads';
import { KEYS } from '@/lib/music';
import type { SongRow, StemRow } from '@/lib/types';

export function CloudSongTools({ song, onChanged }: { song: SongRow; onChanged: () => void }) {
  const { email } = useOrg();
  const owner = isOwnerEmail(email);
  const manage = useServerFn(manageCloudSong);
  const inv = useInvalidate();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState('');
  const [ready, setReady] = useState<Blob | null>(null);
  const stems = useStems(open ? song.id : null);
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist || '');
  const [bpm, setBpm] = useState(Number(song.bpm));
  const [key, setKey] = useState(song.song_key);
  const changed = () => { inv('songs', 'stems', 'cloud'); onChanged(); };
  const remove = async () => {
    if (!confirm(`¿Eliminar «${song.title}» de la nube? Las copias guardadas por otras iglesias se conservarán.`)) return;
    setBusy('Eliminando…');
    try { await manage({ data: { action: 'delete', id: song.id } }); changed(); toast.success('Canción eliminada de la nube'); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(''); }
  };
  const prepare = async () => {
    setBusy('Preparando carpeta…'); setReady(null);
    try { setReady(await prepareSongArchive(stems.data || [], song.title, setBusy)); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(''); }
  };
  return <div className="w-full space-y-2">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => { setOpen(!open); setReady(null); }}><Download className="size-4" />{open ? 'Cerrar descargas' : 'Descargar stems / carpeta'}</Button>
      {owner && <>
        <Button size="sm" variant="outline" title="Editar canción de la nube" aria-label="Editar canción de la nube" onClick={() => setEdit(!edit)}><Pencil className="size-4" /></Button>
        <Button size="sm" variant="outline" title="Eliminar canción de la nube" aria-label="Eliminar canción de la nube" disabled={!!busy} onClick={remove}><Trash2 className="size-4 text-destructive" /></Button>
      </>}
    </div>
    {edit && owner && <form className="flex flex-wrap items-end gap-2 py-2" onSubmit={async ev => {
      ev.preventDefault(); setBusy('Guardando…');
      try { await manage({ data: { action: 'edit', id: song.id, title, artist, bpm, song_key: key } }); setEdit(false); changed(); toast.success('Canción actualizada'); }
      catch (error) { toast.error((error as Error).message); }
      finally { setBusy(''); }
    }}>
      <label className="text-xs">Título<input required value={title} onChange={ev => setTitle(ev.target.value)} className="block h-9 w-full rounded border border-input bg-background px-2" /></label>
      <label className="text-xs">Artista<input value={artist} onChange={ev => setArtist(ev.target.value)} className="block h-9 w-full rounded border border-input bg-background px-2" /></label>
      <label className="text-xs">BPM<input type="number" min={20} max={400} required value={bpm} onChange={ev => setBpm(Number(ev.target.value))} className="block h-9 w-20 rounded border border-input bg-background px-2" /></label>
      <label className="text-xs">Tono<select value={key} onChange={ev => setKey(ev.target.value)} className="block h-9 rounded border border-input bg-background px-2">{KEYS.map(k => <option key={k}>{k}</option>)}</select></label>
      <Button size="sm" disabled={!!busy}>Guardar</Button>
      <Button type="button" size="sm" variant="ghost" aria-label="Cancelar edición" onClick={() => setEdit(false)}><X className="size-4" /></Button>
    </form>}
    {open && <div className="space-y-2 border-t border-border pt-2">
      {stems.isPending && <p className="text-xs text-muted-foreground">Cargando pistas…</p>}
      {stems.error && <p className="text-xs text-destructive">No se pudieron cargar las pistas.</p>}
      {stems.data?.map(stem => <StemDownload key={stem.id} stem={stem} />)}
      {stems.data?.length === 0 && <p className="text-xs text-muted-foreground">Sin pistas disponibles.</p>}
      {!!stems.data?.length && (ready ? <Button size="sm" onClick={() => void deliverFile(ready, `${song.title.replace(/[\\/:*?"<>|]/g, '_')}.zip`)}><Download className="size-4" />Descargar carpeta ZIP</Button> : <Button size="sm" variant="outline" disabled={!!busy} onClick={prepare}>Preparar carpeta ZIP</Button>)}
    </div>}
    {busy && <p role="status" className="font-mono text-xs text-cyan">{busy}</p>}
  </div>;
}

function StemDownload({ stem }: { stem: StemRow }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  return <div className="flex items-center justify-between gap-2 text-xs">
    <span className="min-w-0 truncate">{stem.name}</span>
    <Button size="sm" variant="ghost" disabled={busy || !stem.storage_path} onClick={async () => {
      if (blob) { void deliverFile(blob, stem.file_name || `${stem.name}.wav`); return; }
      setBusy(true);
      try { setBlob(await prepareStem(stem)); } catch (error) { toast.error((error as Error).message); }
      finally { setBusy(false); }
    }}><Download className="size-3" />{busy ? 'Preparando…' : blob ? 'Descargar' : 'Preparar pista'}</Button>
  </div>;
}