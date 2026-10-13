import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org";
import { ROLE_LABEL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — Worship Church Multitrack Player" },
      { name: "description", content: "Tu perfil, iglesias, código de invitación y cuenta." },
      { property: "og:title", content: "Ajustes — Worship Church" },
      { property: "og:description", content: "Tu perfil, iglesias, código de invitación y cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

const box = "space-y-2 rounded-lg border border-border bg-card p-4";
const inp = "h-10 w-full rounded-md border border-input bg-background px-3";

function Settings() {
  const { userId, email, memberships, orgId, setOrgId } = useOrg();
  const qc = useQueryClient();
  const nav = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [confirmTxt, setConfirmTxt] = useState("");
  const [chords, setChords] = useState(() => typeof window !== "undefined" && localStorage.getItem("showChords") !== "0");

  const join = async () => {
    const { error } = await supabase.rpc("join_org_by_code", { _code: code });
    if (error) return toast.error(error.message);
    toast.success("Te uniste a la iglesia"); setCode("");
    qc.invalidateQueries({ queryKey: ["memberships"] });
  };
  const saveName = async () => {
    const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: name });
    error ? toast.error(error.message) : toast.success("Nombre guardado");
  };
  const changePass = async () => {
    const { error } = await supabase.auth.updateUser({ password: pass });
    error ? toast.error(error.message) : (toast.success("Contraseña cambiada"), setPass(""));
  };
  const clearCache = async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    indexedDB.databases?.().then((dbs) => dbs.forEach((d) => d.name && indexedDB.deleteDatabase(d.name)));
    toast.success("Caché de audio borrada");
  };
  const leave = async (org: string) => {
    if (!confirm("¿Salir de esta iglesia?")) return;
    const { error } = await supabase.from("organization_members").delete().eq("org_id", org).eq("user_id", userId);
    error ? toast.error(error.message) : qc.invalidateQueries({ queryKey: ["memberships"] });
  };
  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); };
  const destroy = async () => {
    try { await del(); await supabase.auth.signOut(); nav({ to: "/auth" }); toast.success("Cuenta eliminada"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl text-amber">Ajustes</h1>

      <section className={box}>
        <h2 className="font-semibold">Perfil</h2>
        <p className="text-sm text-muted-foreground">{email}</p>
        <div className="flex gap-2"><input className={inp} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={saveName}>Guardar</Button></div>
        <div className="flex gap-2"><input type="password" className={inp} placeholder="Nueva contraseña" value={pass} onChange={(e) => setPass(e.target.value)} /><Button disabled={pass.length < 6} onClick={changePass}>Cambiar</Button></div>
      </section>

      <section className={box}>
        <h2 className="font-semibold">Unirme a otra iglesia</h2>
        <p className="text-xs text-muted-foreground">Escribe el código de 6 caracteres que te dio el Owner.</p>
        <div className="flex gap-2"><input className={`${inp} font-mono uppercase`} maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /><Button disabled={code.length < 6} onClick={join}>Unirme</Button></div>
      </section>

      <section className={box}>
        <h2 className="font-semibold">Mis iglesias</h2>
        {memberships.map((m) => (
          <div key={m.org_id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{m.organizations?.name} · <span className="font-mono text-xs text-cyan">{ROLE_LABEL[m.role]}</span></span>
            {m.org_id === orgId ? <span className="text-xs text-amber">Activa</span> : <Button size="sm" variant="outline" onClick={() => setOrgId(m.org_id)}>Usar</Button>}
            {m.role !== "owner" && <Button size="sm" variant="outline" onClick={() => leave(m.org_id)}>Salir</Button>}
          </div>
        ))}
      </section>

      <section className={box}>
        <h2 className="font-semibold">Preferencias</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chords} onChange={(e) => { setChords(e.target.checked); localStorage.setItem("showChords", e.target.checked ? "1" : "0"); }} /> Ver acordes en el mezclador</label>
        <Button variant="outline" onClick={clearCache}>Borrar caché de audio offline</Button>
      </section>

      <section className={`${box} border-destructive`}>
        <h2 className="font-semibold text-destructive">Zona de peligro</h2>
        <Button variant="outline" onClick={signOut}>Cerrar sesión</Button>
        <p className="text-xs text-muted-foreground">Para eliminar tu cuenta para siempre escribe ELIMINAR.</p>
        <div className="flex gap-2"><input className={inp} value={confirmTxt} onChange={(e) => setConfirmTxt(e.target.value)} /><Button variant="destructive" disabled={confirmTxt !== "ELIMINAR"} onClick={destroy}>Eliminar cuenta</Button></div>
      </section>
    </div>
  );
}
