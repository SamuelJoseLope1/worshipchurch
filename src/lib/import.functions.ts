import { createServerFn } from "@tanstack/react-start";

const ALLOWED = ["lacuerda.net", "cifraclub.com", "cifraclub.com.br", "ultimate-guitar.com", "acordes.lacuerda.net", "letras.com", "e-chords.com"];

function decode(s: string) {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export const fetchChordPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => d)
  .handler(async ({ data }) => {
    const u = new URL(data.url);
    if (!ALLOWED.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) throw new Error("Sitio no soportado");
    const res = await fetch(u.toString(), { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`No se pudo abrir la página (${res.status})`);
    const html = await res.text();
    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").split(/[-|]/)[0]!.trim();
    const pres = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)].map((m) => decode(m[1]!));
    const body = pres.sort((a, b) => b.length - a.length)[0] ?? "";
    if (!body.trim()) throw new Error("No se encontró el cifrado en la página");
    return { title, body };
  });
