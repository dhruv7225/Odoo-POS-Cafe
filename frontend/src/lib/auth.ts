// src/lib/auth.ts

export interface User {
  name: string;
  email: string;
  role: "admin" | "manager" | "staff" | string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export const mockLogin = (role: string = "admin"): AuthState => {
  const auth: AuthState = {
    token: "mock-jwt-token-xyz-123",
    user: {
      name: role.charAt(0).toUpperCase() + role.slice(1) + " User",
      email: `${role}@poscafe.com`,
      role,
    },
  };
  localStorage.setItem("auth", JSON.stringify(auth));
  return auth;
};

export const logout = (): void => {
  localStorage.removeItem("auth");
};

export const getAuth = (): AuthState | null => {
  const auth = localStorage.getItem("auth");
  if (!auth) return null;
  try {
    return JSON.parse(auth) as AuthState;
  } catch {
    return null;
  }
};
