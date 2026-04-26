import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

export type UserRole = "teacher" | "student";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: string) => Promise<{ needsRole: boolean; email?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJWT(token: string): { user_id: number; email: string; name: string; role: UserRole; exp: number } | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = part + "===".slice((part.length + 3) % 4);
    const binary = atob(padded);
    const json = decodeURIComponent(
      binary.split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("kernel-token");
    if (storedToken) {
      const decoded = parseJWT(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser({
          id: decoded.user_id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        });
        // Also set kernel-role for backward compatibility with DashboardLayout guard
        localStorage.setItem("kernel-role", decoded.role);
      } else {
        // Token expired
        localStorage.removeItem("kernel-token");
        localStorage.removeItem("kernel-role");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    const newToken = data.token;
    localStorage.setItem("kernel-token", newToken);
    const decoded = parseJWT(newToken);
    if (decoded) {
      const newUser: AuthUser = {
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem("kernel-role", decoded.role);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: string) => {
    const data = await api.signup(email, password, name, role);
    const newToken = data.token;
    localStorage.setItem("kernel-token", newToken);
    const decoded = parseJWT(newToken);
    if (decoded) {
      const newUser: AuthUser = {
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem("kernel-role", decoded.role);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, role?: string) => {
    const data = await api.googleAuth(idToken, role);
    if (data.needs_role) {
      return { needsRole: true, email: data.email };
    }
    if (!data.token) throw new Error("Google sign-in failed");
    const newToken = data.token;
    localStorage.setItem("kernel-token", newToken);
    const decoded = parseJWT(newToken);
    if (decoded) {
      const newUser: AuthUser = {
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem("kernel-role", decoded.role);
    }
    return { needsRole: false, email: data.user?.email };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("kernel-token");
    localStorage.removeItem("kernel-role");
    localStorage.removeItem("kernel-user-name");
    localStorage.removeItem("kernel-user-email");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// Backward-compatible hooks
export function useRole() {
  const { user, logout } = useAuth();
  return {
    role: user?.role ?? null,
    setRole: (_role: UserRole) => {},
    clearRole: logout,
  };
}

export function useUser() {
  const { user } = useAuth();
  const nameParts = (user?.name ?? "").split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 2 ? nameParts.slice(-1)[0] : (nameParts[1] ?? "");
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";
  return {
    name: user?.name ?? "",
    firstName,
    middleName,
    lastName,
    email: user?.email ?? "",
    studentId: "",
  };
}
