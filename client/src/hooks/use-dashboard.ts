import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/contexts/branch";

interface DashboardStats {
  totalStudents: number;
  activeLeads: number;
  totalTeachers: number;
  totalRevenue: number;
  pendingFees: number;
  recentLeads: any[];
  courseEnrollments: { courseName: string; studentCount: number }[];
}

export function useDashboardStats(period?: string, from?: string, to?: string) {
  const { selectedBranchId } = useBranch();

  return useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", period, from, to, selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period) params.set("period", period);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (selectedBranchId) params.set("branchId", String(selectedBranchId));
      const url = `/api/dashboard/stats${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });
}
