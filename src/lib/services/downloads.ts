import { storage } from '@/lib/services/storage';
import type { StemRow } from '@/lib/types';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  downloadBlob(blob, filename);
}

export async function prepareStem(stem: StemRow) {
  if (!stem.storage_path) throw new Error('Esta pista no tiene archivo');
  const url = await storage.signedUrl(stem.storage_path);
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo descargar la pista');
  return response.blob();
}

export async function prepareSongArchive(stems: StemRow[], title: string, progress: (message: string) => void) {
  const { zipSync } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  const folder = title.replace(/[\\/:*?"<>|]/g, '_') || 'Canción';
  const available = stems.filter(s => s.storage_path);
  if (!available.length) throw new Error('Esta canción no tiene archivos disponibles');
  for (const [i, stem] of available.entries()) {
    progress(`Preparando ${i + 1}/${available.length}: ${stem.name}`);
    const blob = await prepareStem(stem);
    const name = (stem.file_name || `${stem.name}.wav`).replace(/[\\/:*?"<>|]/g, '_');
    files[`${folder}/${String(i + 1).padStart(3, '0')}-${name}`] = new Uint8Array(await blob.arrayBuffer());
  }
  const bytes = zipSync(files, { level: 0 });
  return new Blob([bytes as BlobPart], { type: 'application/zip' });
}