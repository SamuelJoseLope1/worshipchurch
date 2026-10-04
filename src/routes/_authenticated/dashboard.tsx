import { createFileRoute } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Worship Church Multitrack Player" },
      { name: "description", content: "Centro de control de tu iglesia." },
      { property: "og:title", content: "Dashboard — Worship Church Multitrack Player" },
      { property: "og:description", content: "Centro de control de tu iglesia." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="console-grid min-h-screen bg-background p-6">
      <Brand />
      <h1 className="mt-8 text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Sesión iniciada. Los módulos de canciones, setlists y modo servicio están en construcción.</p>
    </div>
  );
}
