import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { assertCloudOwner } from '@/lib/mixer-timing';

export const manageCloudSong = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.discriminatedUnion('action', [
    z.object({ action: z.literal('edit'), id: z.string().uuid(), title: z.string().trim().min(1).max(250), artist: z.string().max(250), bpm: z.number().min(20).max(400), song_key: z.string().min(1).max(8) }),
    z.object({ action: z.literal('delete'), id: z.string().uuid() }),
  ]).parse(value))
  .handler(async ({ context, data }) => {
    assertCloudOwner(context.claims['email']);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: song, error: lookup } = await supabaseAdmin.from('songs').select('id, shared').eq('id', data.id).single();
    if (lookup || !song?.shared) throw new Error('Canción compartida no encontrada');
    if (data.action === 'edit') {
      const { error } = await supabaseAdmin.from('songs').update({ title: data.title, artist: data.artist || null, bpm: data.bpm, song_key: data.song_key }).eq('id', data.id).eq('shared', true);
      if (error) throw new Error(error.message);
    } else {
      // Media paths can be referenced by copies in other churches. Retain their files.
      const { error } = await supabaseAdmin.from('songs').delete().eq('id', data.id).eq('shared', true);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });