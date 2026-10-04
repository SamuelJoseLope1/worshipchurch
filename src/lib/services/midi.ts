// MidiService — wraps the Web MIDI API. Never invents devices.
import type { MidiAction } from "@/lib/types";

export type MidiPort = { id: string; name: string; manufacturer: string; state: string };
export type MidiStatus = "unsupported" | "idle" | "denied" | "ready";

let access: MIDIAccess | null = null;

export function midiSupported() {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

export async function requestMidi(): Promise<MIDIAccess> {
  if (!midiSupported()) throw new Error("MIDI no disponible en este dispositivo");
  if (access) return access;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
    return access;
  } catch {
    throw new Error("MIDI no disponible: permiso denegado");
  }
}

export function getAccess() { return access; }

export function listPorts(a: MIDIAccess) {
  const map = (p: MIDIPort): MidiPort => ({ id: p.id, name: p.name ?? "Sin nombre", manufacturer: p.manufacturer ?? "", state: p.state });
  return { inputs: [...a.inputs.values()].map(map), outputs: [...a.outputs.values()].map(map) };
}

export function encode(action: MidiAction): number[] {
  const ch = Math.max(0, Math.min(15, action.channel - 1));
  if (action.kind === "pc") return [0xc0 | ch, action.data1 & 0x7f];
  if (action.kind === "cc") return [0xb0 | ch, action.data1 & 0x7f, (action.data2 ?? 127) & 0x7f];
  return [0x90 | ch, action.data1 & 0x7f, (action.data2 ?? 100) & 0x7f];
}

export function sendMidi(outputId: string, action: MidiAction) {
  const out = access?.outputs.get(outputId);
  if (!out) throw new Error("Dispositivo MIDI no conectado");
  const msg = encode(action);
  out.send(msg);
  if (action.kind === "note") {
    const ch = Math.max(0, Math.min(15, action.channel - 1));
    out.send([0x80 | ch, action.data1 & 0x7f, 0], performance.now() + 150);
  }
}

export function describe(data: Uint8Array) {
  const s = data[0] ?? 0, d1 = data[1], d2 = data[2];
  const type = s & 0xf0;
  const ch = (s & 0x0f) + 1;
  if (type === 0x90 && d2) return `Note On  ch${ch} n${d1} v${d2}`;
  if (type === 0x80 || type === 0x90) return `Note Off ch${ch} n${d1}`;
  if (type === 0xb0) return `CC       ch${ch} #${d1} = ${d2}`;
  if (type === 0xc0) return `Program  ch${ch} ${d1}`;
  if (s === 0xf8) return "Clock";
  return `0x${[...data].map((b) => b.toString(16).padStart(2, "0")).join(" ")}`;
}

const OUT_KEY = "wcmp.midiOut";
export const midiPrefs = {
  get: () => (typeof localStorage !== "undefined" ? localStorage.getItem(OUT_KEY) : null),
  set: (id: string) => localStorage.setItem(OUT_KEY, id),
};
