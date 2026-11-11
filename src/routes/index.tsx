import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worship Church Multitrack Player — Centro de producción" },
      { name: "description", content: "Prepara, ensaya, ejecuta y transmite tus servicios desde una sola plataforma." },
      { property: "og:title", content: "Worship Church Multitrack Player" },
      { property: "og:description", content: "Prepara, ensaya, ejecuta y transmite tus servicios desde una sola plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
