// src/lib/auth.ts
import { authApi } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "waiter" | "kitchen" | "cashier" | string;
  roles: string[];       // raw backend roles e.g. ["ADMIN","MANAGER"]
  restaurantId?: number; // set after first restaurant fetch
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

/** Map backend role names to frontend role keys */
function mapRole(backendRoles: string[]): string {
  const r = backendRoles.map((s) => s.toUpperCase());
  if (r.includes("ADMIN")) return "admin";
  if (r.includes("MANAGER")) return "admin"; // manager uses admin UI
  if (r.includes("CASHIER")) return "cashier";
  if (r.includes("WAITER")) return "waiter";
  if (r.includes("CHEF")) return "kitchen";
  return "waiter"; // default
}

export const login = async (email: string, password: string): Promise<AuthState> => {
  const res = await authApi.login(email, password);
  const roles = Array.isArray(res.roles) ? res.roles : Array.from(res.roles as Set<string>);
  const auth: AuthState = {
    token: res.token,
    user: {
      id: res.userId,
      name: res.fullName,
      email: res.email,
      role: mapRole(roles),
      roles,
    },
  };
  localStorage.setItem("auth", JSON.stringify(auth));
  return auth;
};

export const logout = (): void => {
  localStorage.removeItem("auth");
};

export const getAuth = (): AuthState | null => {
  const raw = localStorage.getItem("auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
};

/** Update restaurantId in stored auth */
export const setRestaurantId = (restaurantId: number): void => {
  const raw = localStorage.getItem("auth");
  if (!raw) return;
  try {
    const auth = JSON.parse(raw) as AuthState;
    if (auth.user) {
      auth.user.restaurantId = restaurantId;
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  } catch { /* ignore */ }
};

export const getRestaurantId = (): number | null => {
  const auth = getAuth();
  return auth?.user?.restaurantId ?? null;
};
