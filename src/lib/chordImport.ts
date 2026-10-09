// Convierte cifrados "acorde sobre letra" (LaCuerda, CifraClub, Ultimate Guitar) al formato [Acorde]letra.
const CHORD_RE = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add)?\d*(\([^)]*\))?(sus\d|add\d|maj\d|[#b]\d+)*(\/[A-G](#|b)?)?$/;

export function isChordLine(line: string) {
  const t = line.trim().split(/\s+/).filter(Boolean);
  return t.length > 0 && t.every((x) => CHORD_RE.test(x) || /^[|x\d/-]+$/.test(x));
}

const SECTION_RE = /^\s*\[?\s*(intro|verso|estrofa|coro|pre-?coro|puente|final|outro|interludio|solo|refr[aã]o|ponte|parte\s*\d+|verse|chorus|bridge)[^\]]*\]?\s*:?\s*$/i;

export function chordsOverLyricsToBracket(text: string): string {
  const lines = text.replace(/\t/g, "    ").split(/\r?\n/);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    if (SECTION_RE.test(l)) { out.push(`# ${l.replace(/[[\]:]/g, "").trim()}`); continue; }
    if (isChordLine(l)) {
      const next = lines[i + 1];
      const chords: { pos: number; c: string }[] = [];
      l.replace(/\S+/g, (m, pos: number) => { chords.push({ pos, c: m }); return m; });
      if (next !== undefined && next.trim() && !isChordLine(next) && !SECTION_RE.test(next)) {
        let lyr = next;
        for (const ch of [...chords].reverse()) {
          if (lyr.length < ch.pos) lyr = lyr.padEnd(ch.pos, " ");
          lyr = lyr.slice(0, ch.pos) + `[${ch.c}]` + lyr.slice(ch.pos);
        }
        out.push(lyr.trimEnd()); i++;
      } else out.push(chords.map((c) => `[${c.c}]`).join("  "));
      continue;
    }
    out.push(l.trimEnd());
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
