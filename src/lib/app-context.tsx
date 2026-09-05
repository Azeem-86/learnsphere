import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { createContext, useContext, useCallback } from "react";

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: any;
  user: any;
  selectedOrg: any;
  memberships: any[];
  organizations: any[];
  isSeeded: boolean;
  createProfile: (name: string, email: string, role: string) => Promise<any>;
  selectOrg: (orgId: string) => Promise<any>;
  refreshProfile: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const profile = useQuery(api.users.currentUserProfile);
  const memberships = useQuery(
    api.organizations.getUserOrganizations,
    isAuthenticated ? {} : "skip"
  );
  const allOrgs = useQuery(api.organizations.getAllOrganizations);
  const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
  const selectOrgMutation = useMutation(api.users.selectOrg);

  const isLoading = authLoading || profile === undefined;

  const selectedOrg = profile?.selectedOrgId
    ? memberships?.find((m: any) => m.orgId === profile.selectedOrgId)?.org ?? null
    : memberships?.[0]?.org ?? null;

  const isSeeded = (allOrgs?.length ?? 0) > 0;

  const createProfile = useCallback(
    async (name: string, email: string, role: string) => {
      return await getOrCreateProfile({
        name,
        email,
        role: role as "super_admin" | "org_admin" | "instructor" | "learner",
      });
    },
    [getOrCreateProfile]
  );

  const selectOrg = useCallback(
    async (orgId: string) => {
      await selectOrgMutation({ orgId: orgId as any });
    },
    [selectOrgMutation]
  );

  const refreshProfile = useCallback(() => {
    // Query refreshes automatically with Convex
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        profile,
        user,
        selectedOrg,
        memberships: memberships ?? [],
        organizations: allOrgs ?? [],
        isSeeded,
        createProfile,
        selectOrg,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
