import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER = "samueljoselopegames@gmail.com";
const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const assertOwner = (claims: Record<string, unknown>) => {
  if (String(claims["email"] ?? "").toLowerCase() !== OWNER) throw new Error("Página inexistente");
};

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const a = await admin();
    await a.from("organization_members").delete().eq("user_id", context.userId);
    const { error } = await a.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const a = await admin();
    const { data, error } = await a.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    const { data: profs } = await a.from("profiles").select("id, display_name");
    const { data: mem } = await a.from("organization_members").select("user_id, role, organizations(name)");
    const { data: orgs } = await a.from("organizations").select("id", { count: "exact", head: true });
    return {
      orgCount: (orgs as unknown as null) ? 0 : 0,
      users: data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        name: profs?.find((p) => p.id === u.id)?.display_name ?? "",
        created: u.created_at,
        last: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        banned: !!(u as { banned_until?: string | null }).banned_until,
        orgs: (mem ?? []).filter((m) => m.user_id === u.id).map((m) => `${(m.organizations as { name: string } | null)?.name ?? "?"} (${m.role})`),
      })),
    };
  });

export const saUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; email?: string | undefined; name?: string | undefined; password?: string; ban?: boolean; confirm?: boolean }) => d)
  .handler(async ({ context, data }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const a = await admin();
    const attrs: Record<string, unknown> = {};
    if (data.email) attrs["email"] = data.email;
    if (data.password) { if (data.password.length < 6) throw new Error("Mínimo 6 caracteres"); attrs["password"] = data.password; }
    if (data.ban !== undefined) attrs["ban_duration"] = data.ban ? "876000h" : "none";
    if (data.confirm) attrs["email_confirm"] = true;
    if (Object.keys(attrs).length) {
      const { error } = await a.auth.admin.updateUserById(data.id, attrs);
      if (error) throw new Error(error.message);
    }
    if (data.name !== undefined) await a.from("profiles").upsert({ id: data.id, display_name: data.name });
    return { ok: true };
  });

export const saResetLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; redirect: string }) => d)
  .handler(async ({ context, data }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const a = await admin();
    const { data: r, error } = await a.auth.admin.generateLink({ type: "recovery", email: data.email, options: { redirectTo: data.redirect } });
    if (error) throw new Error(error.message);
    return { link: r.properties.action_link };
  });

export const saDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const a = await admin();
    await a.from("organization_members").delete().eq("user_id", data.id);
    const { error } = await a.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
