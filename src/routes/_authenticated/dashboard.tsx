import { createFileRoute, Link } from "@tanstack/react-router";
import { useSetlists, useSongs } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Inicio — Worship Church Multitrack Player" },
      { name: "description", content: "Centro de control de tu iglesia." },
      { property: "og:title", content: "Inicio — Worship Church Multitrack Player" },
      { property: "og:description", content: "Centro de control de tu iglesia." },
    ],
  }),
  component: Dashboard,
});

const CULT_DAYS = [2, 5, 6, 0];
function nextCultDay() {
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    if (CULT_DAYS.includes(x.getDay())) return { date: x, today: i === 0 };
  }
  return { date: d, today: true };
}

function Dashboard() {
  const songs = useSongs();
  const setlists = useSetlists();
  const nc = nextCultDay();
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="font-mono text-xs uppercase text-muted-foreground">{nc.today ? "Hoy es día de culto" : "Próximo culto"}</div>
        <div className="mt-1 text-2xl font-semibold text-amber">{nc.date.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</div>
        <p className="mt-1 text-sm text-muted-foreground">{nc.today ? "Modo servicio: reproducción maestra." : "Fuera de culto: Modo Práctica disponible."}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/songs" className="rounded-lg border border-border bg-card p-5 hover:border-primary">
          <div className="font-mono text-4xl text-primary">{songs.data?.length ?? "—"}</div>
          <div className="mt-1 text-sm text-muted-foreground">Canciones</div>
        </Link>
        <Link to="/setlists" className="rounded-lg border border-border bg-card p-5 hover:border-primary">
          <div className="font-mono text-4xl text-primary">{setlists.data?.length ?? "—"}</div>
          <div className="mt-1 text-sm text-muted-foreground">Setlists</div>
        </Link>
      </div>
    </div>
  );
}
