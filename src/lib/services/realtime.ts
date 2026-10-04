// RealtimeService / RemoteService — director <-> remote devices over Cloud realtime channels.
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SessionState = {
  songTitle: string | null;
  songId: string | null;
  playing: boolean;
  position: number;
  duration: number;
  bpm: number;
  key: string;
  section: string | null;
  nextSection: string | null;
  loop: boolean;
  setlist: { id: string; title: string }[];
  updatedAt: number;
};

export type RemoteCommand =
  | { type: "play" | "pause" | "stop" | "next" | "prev" | "loop" | "nextSection" | "prevSection" }
  | { type: "jump"; section: string }
  | { type: "tempo"; delta: number }
  | { type: "transpose"; delta: number }
  | { type: "loadIndex"; index: number }
  | { type: "master"; value: number };

export type DevicePresence = { device: string; role: "director" | "remote" | "display"; name: string; joinedAt: number };

export function makeCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function deviceKind(): string {
  if (typeof navigator === "undefined") return "Desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Móvil";
  return "Desktop";
}

export function openSessionChannel(
  code: string,
  me: DevicePresence,
  handlers: {
    onState?: (s: SessionState) => void;
    onCommand?: (c: RemoteCommand) => void;
    onPresence?: (list: DevicePresence[]) => void;
    onStatus?: (status: string) => void;
  },
): RealtimeChannel {
  const ch = supabase.channel(`wcmp-session-${code}`, {
    config: { broadcast: { self: false }, presence: { key: crypto.randomUUID() } },
  });
  ch.on("broadcast", { event: "state" }, ({ payload }) => handlers.onState?.(payload as SessionState));
  ch.on("broadcast", { event: "cmd" }, ({ payload }) => handlers.onCommand?.(payload as RemoteCommand));
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState<DevicePresence>();
    handlers.onPresence?.(Object.values(st).flat());
  });
  ch.subscribe(async (status) => {
    handlers.onStatus?.(status);
    if (status === "SUBSCRIBED") await ch.track(me);
  });
  return ch;
}
