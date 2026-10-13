import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useOrg } from "@/lib/org";
import { isOwnerEmail } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saDeleteUser, saListUsers, saResetLink, saUpdateUser } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/sa")({
  head: () => ({ meta: [{ title: "Worship Church" }, { name: "robots", content: "noindex" }] }),
  component: Gate,
});

function Gate() {
  const { email } = useOrg();
  if (!isOwnerEmail(email)) return <Navigate to="/dashboard" />;
  return <Console />;
}

type U = Awaited<ReturnType<typeof saListUsers>>["users"][number];

function Console() {
  const list = useServerFn(saListUsers);
  const q = useQuery({ queryKey: ["sa-users"], queryFn: () => list() });
  const [f, setF] = useState("");
  const users = (q.data?.users ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(f.toLowerCase()));
  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl text-amber">Consola maestra</h1>
      <div className="grid grid-cols-3 gap-2">
        <Stat l="Usuarios" v={q.data?.users.length} />
        <Stat l="Confirmados" v={q.data?.users.filter((u) => u.confirmed).length} />
        <Stat l="Bloqueados" v={q.data?.users.filter((u) => u.banned).length} />
      </div>
      <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Buscar usuario…" value={f} onChange={(e) => setF(e.target.value)} />
      {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {q.error && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
      <ul className="space-y-2">{users.map((u) => <Row key={u.id} u={u} reload={() => q.refetch()} />)}</ul>
    </div>
  );
}

const Stat = ({ l, v }: { l: string; v?: number }) => (
  <div className="rounded-lg border border-border bg-card p-3"><div className="font-mono text-3xl text-cyan">{v ?? "…"}</div><div className="text-xs text-muted-foreground">{l}</div></div>
);

function Row({ u, reload }: { u: U; reload: () => void }) {
  const upd = useServerFn(saUpdateUser), reset = useServerFn(saResetLink), del = useServerFn(saDeleteUser);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(u.email), [name, setName] = useState(u.name), [pass, setPass] = useState("");
  const run = async (p: Promise<unknown>, ok: string) => { try { await p; toast.success(ok); reload(); } catch (e) { toast.error((e as Error).message); } };
  const inp = "h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <li className="rounded-md border border-border bg-card px-3 py-2">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(!open)}>
        <span className="flex-1"><b>{u.name || u.email}</b> <span className="text-xs text-muted-foreground">{u.email}</span></span>
        {u.banned && <span className="text-xs text-destructive">Bloqueado</span>}
        {!u.confirmed && <span className="text-xs text-amber">Sin confirmar</span>}
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">Registro: {new Date(u.created).toLocaleDateString()} · Último acceso: {u.last ? new Date(u.last).toLocaleString() : "nunca"} · {u.orgs.join(", ") || "sin iglesia"}</p>
          <div className="flex gap-2"><input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" /><input className={inp} value={email} onChange={(e) => setEmail(e.target.value)} /><Button size="sm" onClick={() => run(upd({ data: { id: u.id, name, email: email !== u.email ? email : undefined } }), "Guardado")}>Guardar</Button></div>
          <div className="flex gap-2"><input className={inp} type="text" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nueva contraseña" /><Button size="sm" disabled={pass.length < 6} onClick={() => run(upd({ data: { id: u.id, password: pass } }), "Contraseña cambiada")}>Establecer</Button></div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => run(reset({ data: { email: u.email, redirect: `${location.origin}/reset-password` } }).then((r) => navigator.clipboard.writeText(r.link)), "Enlace de recuperación copiado")}>Copiar enlace de recuperación</Button>
            {!u.confirmed && <Button size="sm" variant="outline" onClick={() => run(upd({ data: { id: u.id, confirm: true } }), "Confirmado")}>Confirmar correo</Button>}
            <Button size="sm" variant="outline" onClick={() => run(upd({ data: { id: u.id, ban: !u.banned } }), u.banned ? "Desbloqueado" : "Bloqueado")}>{u.banned ? "Desbloquear" : "Bloquear"}</Button>
            <Button size="sm" variant="destructive" onClick={() => confirm(`¿Eliminar ${u.email}?`) && run(del({ data: { id: u.id } }), "Eliminado")}>Eliminar</Button>
          </div>
        </div>
      )}
    </li>
  );
}
