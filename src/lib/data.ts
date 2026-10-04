// SongService / SetlistService / StemService data hooks (TanStack Query + Cloud).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/lib/org";
import type { SetlistItemRow, SetlistRow, SongRow, StemRow } from "@/lib/types";

export function useSongs() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["songs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").eq("org_id", orgId).order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SongRow[];
    },
  });
}

export function useSong(id: string) {
  return useQuery({
    queryKey: ["songs", "one", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as SongRow | null;
    },
  });
}

export function useStems(songId: string | null | undefined) {
  return useQuery({
    queryKey: ["stems", songId],
    enabled: !!songId,
    queryFn: async () => {
      const { data, error } = await supabase.from("stems").select("*").eq("song_id", songId!).order("sort_order");
      if (error) throw error;
      return data as StemRow[];
    },
  });
}

export function useAllStems() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["stems", "org", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("stems").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as StemRow[];
    },
  });
}

export function useSetlists() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["setlists", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setlists")
        .select("*, setlist_items(id)")
        .eq("org_id", orgId)
        .order("service_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as (SetlistRow & { setlist_items: { id: string }[] })[];
    },
  });
}

export type SetlistItemWithSong = SetlistItemRow & { songs: SongRow | null };

export function useSetlist(id: string | null | undefined) {
  return useQuery({
    queryKey: ["setlists", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("setlists").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      const { data: items, error: e2 } = await supabase
        .from("setlist_items")
        .select("*, songs(*)")
        .eq("setlist_id", id!)
        .order("position");
      if (e2) throw e2;
      return data ? { ...(data as SetlistRow), items: (items ?? []) as SetlistItemWithSong[] } : null;
    },
  });
}

export function usePresets(kind: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["presets", orgId, kind],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("org_presets").select("*").eq("org_id", orgId).eq("kind", kind).order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export const DEMO_LYRICS = `# Intro
[G]  [D/F#]  [Em]  [C]

# Verso 1
[G]Cuando el día empieza a [D/F#]despertar
[Em]tu fidelidad vuelve a [C]brillar
[G]Cada sombra cede a[D/F#]nte tu voz
[Em]nueva es tu gracia, [C]oh Dios

# Coro
[C]Amanecer de [G]gracia
[D]luz que nunca [Em]cesa
[C]Todo lo que [G]soy
[D]te lo entrego [G]hoy

# Puente
[Em]No hay noche que [C]pueda
[G]apagar tu [D]amor
[Em]No hay noche que [C]pueda
[G]apagar tu [D]amor

# Final
[C]Te lo entrego [D]hoy  [G]`;
