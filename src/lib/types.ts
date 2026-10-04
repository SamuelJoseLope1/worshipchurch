import type { Database } from "@/integrations/supabase/types";

export type SongRow = Database["public"]["Tables"]["songs"]["Row"];
export type StemRow = Database["public"]["Tables"]["stems"]["Row"];
export type SetlistRow = Database["public"]["Tables"]["setlists"]["Row"];
export type SetlistItemRow = Database["public"]["Tables"]["setlist_items"]["Row"];
export type OrgRole = Database["public"]["Enums"]["org_role"];

export type Arrangement = { id: string; name: string; sections: string[] };
export type MarkerType = "Section" | "Cue" | "MIDI" | "Automation" | "Custom";
export type MidiAction = { kind: "pc" | "cc" | "note"; channel: number; data1: number; data2?: number };
export type Marker = {
  id: string;
  time: number;
  name: string;
  type: MarkerType;
  color: string;
  midi?: MidiAction;
};
export type CueKind = "visual" | "audio" | "midi";
export type Cue = { id: string; time: number; label: string; kind: CueKind; enabled: boolean };

/** Per-setlist override; never mutates the original song. */
export type SetlistOverrides = {
  key?: string;
  bpm?: number;
  arrangementId?: string;
  stemMutes?: Record<string, boolean>;
  stemVolumes?: Record<string, number>;
  click?: boolean;
  pad?: boolean;
  cues?: boolean;
  notes?: string;
};

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  director: "Director",
  musician: "Músico",
  operator: "Operador",
  presenter: "Presentador",
  viewer: "Viewer",
};

export const uid = () => crypto.randomUUID();

export function asArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
