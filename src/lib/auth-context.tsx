"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { restoreTheme, resetTheme, applyTheme } from "@/lib/theme-runtime";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Condominium {
  id: number;
  uuid: string;
  code: string;
  name: string;
  city?: string;
  country?: string;
  status?: number;
  theme_id?: string | null;
}

export interface UserContext {
  id: number;
  email: string;
  name?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  } | null;
  roles_by_condominium?: Record<number, Array<{ id: number; name: string; condominium_theme_id?: string | null }>>;
  condominiums: Condominium[];
}

interface AuthState {
  user: UserContext | null;
  selectedCondominium: Condominium | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  selectCondominium: (condo: Condominium) => void;
  refreshContext: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserContext | null>(null);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────

  useEffect(() => {
    const access = localStorage.getItem("access_token");
    const savedCondo = localStorage.getItem("selected_condominium");

    if (access) {
      if (savedCondo) {
        try {
          const parsed = JSON.parse(savedCondo);
          setSelectedCondominium(parsed);
          // Restore theme from persisted condominium
          restoreTheme(parsed.theme_id);
        } catch {
          // invalid JSON, ignore
        }
      }
      // Fetch current user context
      fetchContext().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch user context (condominiums from /me/contexts) ────────────────

  async function fetchContext(): Promise<void> {
    const { data, error } = await api.get<{
      success: boolean;
      data: {
        user: { id: number; email: string };
        profile: { first_name: string; last_name: string; avatar_url?: string } | null;
        roles_by_condominium: Record<
          number,
          Array<{ id: number; name: string; condominium_id: number; condominium_name?: string | null; condominium_theme_id?: string | null }>
        >;
        ownerships: Array<{ id: number; condominium_id: number; unit_id: number }>;
      };
    }>("/me/contexts");

    if (error || !data?.data) {
      api.clearTokens();
      setUser(null);
      setSelectedCondominium(null);
      return;
    }

    const ctx = data.data;

    // Extract condominiums from roles (enriched with name + theme_id from backend)
    const condominiums: Condominium[] = [];

    if (ctx.roles_by_condominium) {
      for (const [condoIdStr, roles] of Object.entries(
        ctx.roles_by_condominium
      )) {
        const condoId = Number(condoIdStr);
        // Use enrichment from backend: condominium_name and condominium_theme_id
        const enrichment = roles[0];
        const theme_id = enrichment?.condominium_theme_id ?? undefined;
        const name = enrichment?.condominium_name ?? `Condominio #${condoId}`;
        condominiums.push({
          id: condoId,
          uuid: "",
          code: "",
          name,
          theme_id,
        });
      }
    }

    // Also check ownerships for condominium references
    if (ctx.ownerships) {
      for (const own of ctx.ownerships) {
        if (
          own.condominium_id &&
          !condominiums.find((c) => c.id === own.condominium_id)
        ) {
          condominiums.push({
            id: own.condominium_id,
            uuid: "",
            code: "",
            name: `Condominio #${own.condominium_id}`,
          });
        }
      }
    }

    // Bulk-fetch condominium details in ONE call (eliminates N+1)
    const resolvedCondos: Condominium[] = [...condominiums];
    if (condominiums.length > 0) {
      const condoIds = condominiums.map((c) => c.id).join(",");
      const { data: bulkData } = await api.get<{
        success: boolean;
        data: {
          items: Array<{
            id: number;
            uuid: string;
            code: string;
            name: string;
            city?: string;
            country?: string;
            status: number;
            theme_id?: string | null;
          }>;
        };
      }>(`/condominiums?ids=${condoIds}&limit=200`);

      if (bulkData?.data?.items) {
        const bulkMap = new Map(
          bulkData.data.items.map((c) => [c.id, c])
        );
        for (const condo of resolvedCondos) {
          const details = bulkMap.get(condo.id);
          if (details) {
            condo.uuid = details.uuid;
            condo.code = details.code;
            condo.name = details.name;
            condo.city = details.city;
            condo.country = details.country;
            condo.status = details.status;
            // Prefer theme_id from dedicated endpoint; fallback to role enrichment
            condo.theme_id = details.theme_id ?? condo.theme_id;
          }
        }
      }
    }

    setUser({
      id: ctx.user.id,
      email: ctx.user.email,
      profile: ctx.profile
        ? {
            first_name: ctx.profile.first_name,
            last_name: ctx.profile.last_name,
            avatar_url: ctx.profile.avatar_url,
          }
        : null,
      roles_by_condominium: ctx.roles_by_condominium,
      condominiums: resolvedCondos,
    });
  }

  const refreshContext = useCallback(async () => {
    await fetchContext();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { data, error } = await api.post<{
        success: boolean;
        data: {
          access_token: string;
          refresh_token: string;
          user?: { id: number; email: string };
        };
      }>("/auth/login", { email, password });

      if (error) {
        return error.message;
      }

      const tokens = data?.data;
      if (tokens?.access_token && tokens?.refresh_token) {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);

        // Fetch full context
        await fetchContext();
        return null; // success
      }

      return "Respuesta inesperada del servidor";
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await api.post("/auth/logout", { refresh_token: refresh }).catch(() => {});
    }
    api.clearTokens();
    resetTheme();
    setUser(null);
    setSelectedCondominium(null);
    router.push("/login");
  }, [router]);

  // ── Select Condominium ─────────────────────────────────────────────────

  const selectCondominium = useCallback((condo: Condominium) => {
    setSelectedCondominium(condo);
    localStorage.setItem("selected_condominium", JSON.stringify(condo));
    // Apply condominium theme immediately
    applyTheme(condo.theme_id);
  }, []);

  // ── Value ──────────────────────────────────────────────────────────────

  const value: AuthState = {
    user,
    selectedCondominium,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    selectCondominium,
    refreshContext,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
