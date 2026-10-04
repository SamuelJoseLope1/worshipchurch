// OrganizationService + current-org context.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OrgRole } from "@/lib/types";

export type Membership = { org_id: string; role: OrgRole; organizations: { id: string; name: string } | null };

type Ctx = {
  userId: string;
  email: string;
  memberships: Membership[];
  orgId: string | null;
  orgName: string;
  role: OrgRole | null;
  setOrgId: (id: string) => void;
  loading: boolean;
  can: (action: "edit" | "delete" | "admin") => boolean;
};

const OrgContext = createContext<Ctx | null>(null);
const KEY = "wcmp.currentOrg";

export function OrgProvider({ userId, email, children }: { userId: string; email: string; children: ReactNode }) {
  const [orgId, setOrg] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("org_id, role, organizations(id, name)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as Membership[];
    },
  });

  useEffect(() => {
    const list = q.data ?? [];
    if (!list.length) return;
    const saved = localStorage.getItem(KEY);
    const pick = list.find((m) => m.org_id === saved)?.org_id ?? list[0].org_id;
    setOrg(pick);
  }, [q.data]);

  const current = (q.data ?? []).find((m) => m.org_id === orgId) ?? null;
  const role = current?.role ?? null;
  const can: Ctx["can"] = (a) => {
    if (!role) return false;
    if (a === "admin") return role === "owner" || role === "admin";
    if (a === "delete") return ["owner", "admin", "director"].includes(role);
    return role !== "viewer";
  };

  return (
    <OrgContext.Provider
      value={{
        userId,
        email,
        memberships: q.data ?? [],
        orgId: current ? orgId : null,
        orgName: current?.organizations?.name ?? "",
        role,
        setOrgId: (id) => { localStorage.setItem(KEY, id); setOrg(id); },
        loading: q.isLoading,
        can,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const c = useContext(OrgContext);
  if (!c) throw new Error("useOrg outside OrgProvider");
  return c;
}

/** Org-scoped id for queries; throws in UI only after the gate guarantees an org. */
export function useOrgId(): string {
  const { orgId } = useOrg();
  return orgId ?? "";
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
