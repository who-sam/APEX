import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "teacher" | "student";

interface RoleContextType {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem("apex-role");
    return (stored === "teacher" || stored === "student") ? stored : null;
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("apex-role", newRole);
  };

  const clearRole = () => {
    setRoleState(null);
    localStorage.removeItem("apex-role");
  };

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
}
