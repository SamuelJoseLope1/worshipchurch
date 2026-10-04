// LyricsService + music theory helpers (pure, framework-free).
export const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
export type Key = (typeof KEYS)[number];

const ALIASES: Record<string, number> = {
  C: 0, "B#": 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4, F: 5, "E#": 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11, Cb: 11,
};

export function noteIndex(note: string): number {
  const base = note.replace(/m$/, "");
  return ALIASES[base] ?? 0;
}

export function semitonesBetween(from: string, to: string): number {
  let d = noteIndex(to) - noteIndex(from);
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

export function transposeNote(note: string, semis: number): string {
  if (!(note in ALIASES)) return note;
  return KEYS[(((ALIASES[note]! + semis) % 12) + 12) % 12]!;
}

/** Transposes a chord symbol like "G/B", "F#m7", "Bbsus4". */
export function transposeChord(chord: string, semis: number): string {
  if (!semis) return chord;
  return chord.replace(/([A-G](?:#|b)?)/g, (m) => transposeNote(m, semis));
}

export function transposeLyrics(text: string, semis: number): string {
  if (!semis) return text;
  return text.replace(/\[([^\]]+)\]/g, (_, c: string) => `[${transposeChord(c, semis)}]`);
}

export type LyricLine = { raw: string; text: string; chords: { pos: number; chord: string }[] };
export type LyricSection = { name: string; lines: LyricLine[] };

/** Format: lines starting with "# " start a section; chords inline in [brackets]. */
export function parseLyrics(text: string): LyricSection[] {
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const header = raw.match(/^#\s*(.+)$/);
    if (header) {
      current = { name: header[1]!.trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      if (!raw.trim()) continue;
      current = { name: "Letra", lines: [] };
      sections.push(current);
    }
    const chords: LyricLine["chords"] = [];
    let plain = "";
    const re = /\[([^\]]+)\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw))) {
      plain += raw.slice(last, m.index);
      chords.push({ pos: plain.length, chord: m[1]! });
      last = m.index + m[0].length;
    }
    plain += raw.slice(last);
    current.lines.push({ raw, text: plain, chords });
  }
  return sections.map((s) => ({
    ...s,
    lines: trimEmpty(s.lines),
  }));
}

function trimEmpty(lines: LyricLine[]) {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a]!.text.trim() && !lines[a]!.chords.length) a++;
  while (b > a && !lines[b - 1]!.text.trim() && !lines[b - 1]!.chords.length) b--;
  return lines.slice(a, b);
}

/** Renders the chord line above lyrics for monospaced display. */
export function chordLine(line: LyricLine): string {
  let out = "";
  for (const c of line.chords) {
    if (out.length < c.pos) out = out.padEnd(c.pos, " ");
    else if (out.length) out += " ";
    out += c.chord;
  }
  return out;
}

export function noteFrequency(note: string, octave = 3): number {
  const midi = 12 * (octave + 1) + noteIndex(note);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"] as const;

export function beatsPerBar(sig: string) {
  return Number(sig.split("/")[0]) || 4;
}

export const SECTION_TYPES = [
  "Intro", "Verse", "Pre-Chorus", "Chorus", "Post-Chorus", "Bridge",
  "Instrumental", "Solo", "Breakdown", "Outro", "Custom",
] as const;
