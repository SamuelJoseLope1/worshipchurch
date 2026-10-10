import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEFAULT_THEME, displayChannel, type DisplayMessage } from "@/lib/services/presentation";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "Pantalla de proyección — Worship Church Multitrack Player" },
      { name: "description", content: "Salida limpia de letras para proyector o segunda pantalla." },
      { property: "og:title", content: "Pantalla de proyección — Worship Church" },
      { property: "og:description", content: "Salida limpia de letras para proyector." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Display,
});

function Display() {
  const [msg, setMsg] = useState<DisplayMessage>({ type: "blank", theme: DEFAULT_THEME });
  useEffect(() => {
    const ch = displayChannel();
    if (!ch) return;
    ch.onmessage = (e) => { if ((e.data as DisplayMessage).type !== "ping") setMsg(e.data); };
    ch.postMessage({ type: "ping" });
    return () => ch.close();
  }, []);
  const t = msg.type === "ping" ? DEFAULT_THEME : msg.theme;
  return (
    <div onDoubleClick={() => document.documentElement.requestFullscreen?.()} className="fixed inset-0 flex cursor-none items-center justify-center p-[5vw]" style={{ background: t.bg, color: t.fg, textAlign: t.align }}>
      {msg.type === "slide" && (
        <div className="font-semibold leading-tight" style={{ fontSize: t.size }}>
          {msg.lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
