import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number | null) => void;
  selectedBranch: Branch | null;
}

const BranchContext = createContext<BranchContextType | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("selectedBranchId");
    return stored ? Number(stored) : null;
  });

  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });

  const setSelectedBranchId = (id: number | null) => {
    setSelectedBranchIdState(id);
    if (id === null) localStorage.removeItem("selectedBranchId");
    else localStorage.setItem("selectedBranchId", String(id));
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId) ?? null;

  return (
    <BranchContext.Provider value={{ branches, selectedBranchId, setSelectedBranchId, selectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
