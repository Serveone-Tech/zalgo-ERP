// client/src/contexts/auth.tsx — REPLACE
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { queryClient } from "@/lib/queryClient";
import { hasPerm, type PermAction } from "@/lib/permissions";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  branchId: number | null;
  isActive: boolean;
  isOnboarded?: boolean;
}

interface SubscriptionStatus {
  status: "none" | "active" | "expiring_soon" | "expired" | "superadmin";
  daysLeft: number;
  plan: { id: number; name: string; allowedModules: string[] } | null;
  endDate?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  markOnboarded: () => void;
  hasPermission: (module: string, action: PermAction) => boolean;
  canAccess: (module: string) => boolean;
  canUseModule: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const res = await fetch("/api/plans/subscription/status", {
        credentials: "include",
      });
      if (res.ok) setSubscription(await res.json());
    } catch {
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        setUser(await res.json());
        fetchSubscription();
      } else {
        setUser(null);
        setSubscription(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.message || "Login failed");
    }
    const data = await res.json();
    setUser(data.user);
    queryClient.clear();
    fetchSubscription();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setSubscription(null);
    queryClient.clear();
  };

  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);
  const markOnboarded = useCallback(() => {
    setUser((u) => (u ? { ...u, isOnboarded: true } : u));
  }, []);

  const hasPermission = useCallback(
    (module: string, action: PermAction): boolean => {
      if (!user) return false;
      if (user.role === "admin" || user.role === "superadmin") return true;
      return hasPerm(user.permissions ?? [], module, action);
    },
    [user],
  );

  const canAccess = useCallback(
    (module: string): boolean => {
      if (!user) return false;
      if (user.role === "admin" || user.role === "superadmin") return true;
      return hasPerm(user.permissions ?? [], module, "read");
    },
    [user],
  );

  const canUseModule = useCallback(
    (module: string): boolean => {
      if (!user) return false;
      if (user.role === "superadmin") return true;
      const allowed: string[] = subscription?.plan?.allowedModules ?? [];
      // Empty array = all modules allowed (plan has no restriction set)
      if (allowed.length === 0) return true;
      return allowed.includes(module);
    },
    [user, subscription],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        subscription,
        subscriptionLoading,
        login,
        logout,
        refreshSubscription,
        markOnboarded,
        hasPermission,
        canAccess,
        canUseModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
