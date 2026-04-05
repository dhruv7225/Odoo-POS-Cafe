import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthState } from "@/lib/auth";
import { getAuth, logout as doLogout, login as doLogin, setRestaurantId } from "@/lib/auth";
import { restaurantApi } from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  restaurantId: number | null;
  setActiveRestaurant: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setResId] = useState<number | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      setAuthState(auth);
      setResId(auth.user?.restaurantId ?? null);
      // Auto-load first restaurant if not set
      if (auth.token && !auth.user?.restaurantId) {
        restaurantApi.list().then((restaurants: any[]) => {
          if (restaurants.length > 0) {
            setRestaurantId(restaurants[0].id);
            setResId(restaurants[0].id);
          }
        }).catch(() => { /* ignore on load */ });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const auth = await doLogin(email, password);
    setAuthState(auth);
    // Fetch restaurant
    try {
      const restaurants = await restaurantApi.list();
      if (restaurants.length > 0) {
        setRestaurantId(restaurants[0].id);
        setResId(restaurants[0].id);
      }
    } catch { /* user may not have restaurant access */ }
  };

  const logout = () => {
    doLogout();
    setAuthState({ token: null, user: null });
    setResId(null);
  };

  const setActiveRestaurant = (id: number) => {
    setRestaurantId(id);
    setResId(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading, restaurantId, setActiveRestaurant }}>
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
