// StemService helpers: classification of imported files.
export const STEM_TYPES = [
  "Drums", "Percussion", "Bass", "Electric Guitar", "Acoustic Guitar", "Piano", "Keys",
  "Synth", "Strings", "Pads", "FX", "Vocals", "Backing Vocals", "Click", "Cues", "Custom",
] as const;
export type StemType = (typeof STEM_TYPES)[number];

export const STEM_GROUPS = ["Instruments", "Vocals", "FX", "Click", "Cues"] as const;

const RULES: [RegExp, StemType][] = [
  [/click|metro|clk/i, "Click"],
  [/cue|guide|gu[ií]a/i, "Cues"],
  [/b(g|k)v|backing|coro|choir|harm/i, "Backing Vocals"],
  [/vox|vocal|voz|lead/i, "Vocals"],
  [/perc|shaker|tamb|conga/i, "Percussion"],
  [/drum|bater|kick|snare|kit/i, "Drums"],
  [/bass|bajo|sub/i, "Bass"],
  [/a(c|k)ous|ac\.?\s?gtr|ag\b/i, "Acoustic Guitar"],
  [/guit|gtr|eg\b/i, "Electric Guitar"],
  [/piano|pno/i, "Piano"],
  [/key|organ|rhodes|teclad/i, "Keys"],
  [/synth|sint|arp/i, "Synth"],
  [/string|cuerda|violin|cello/i, "Strings"],
  [/pad/i, "Pads"],
  [/fx|sfx|riser|sweep|efect/i, "FX"],
];

export function detectStemType(fileName: string): StemType {
  const base = fileName.replace(/\.[^.]+$/, "");
  for (const [re, t] of RULES) if (re.test(base)) return t;
  return "Custom";
}

export function groupFor(t: string): string {
  if (t === "Vocals" || t === "Backing Vocals") return "Vocals";
  if (t === "FX") return "FX";
  if (t === "Click") return "Click";
  if (t === "Cues") return "Cues";
  return "Instruments";
}

export function colorFor(t: string): string {
  if (t === "Click" || t === "Cues") return "rose";
  if (t.includes("Vocal")) return "lime";
  if (t === "Drums" || t === "Percussion") return "amber";
  return "cyan";
}

export const STEM_COLOR_BG: Record<string, string> = {
  amber: "bg-amber",
  cyan: "bg-cyan",
  lime: "bg-lime",
  rose: "bg-rose",
};

export const AUDIO_EXT = /\.(wav|mp3|m4a|aac|ogg|flac|aif|aiff|webm)$/i;
