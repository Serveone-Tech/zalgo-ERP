import { useAuth } from "@/contexts/auth";
import type { PermAction } from "@/lib/permissions";

/**
 * Returns permission flags for a specific module.
 * Admin always gets full access.
 */
export function usePermission(module: string) {
  const { hasPermission } = useAuth();
  return {
    canRead:   hasPermission(module, "read"),
    canWrite:  hasPermission(module, "write"),
    canDelete: hasPermission(module, "delete"),
  };
}
