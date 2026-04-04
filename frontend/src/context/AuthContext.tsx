// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthState } from "@/lib/auth";
import { getAuth, mockLogin as mockAuthLogin, logout as mockAuthLogout } from "@/lib/auth";

interface AuthContextType extends AuthState {
  login: (role?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      setAuthState(auth);
    }
    setIsLoading(false);
  }, []);

  const login = (role: string = "admin") => {
    const auth = mockAuthLogin(role);
    setAuthState(auth);
  };

  const logout = () => {
    mockAuthLogout();
    setAuthState({ token: null, user: null });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
