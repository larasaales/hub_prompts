import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginTime: number | null;
  login: (user: User) => void;
  logout: () => void;
  checkExpiration: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, // Start logged out so the user sees the hero screen
      isAuthenticated: false,
      loginTime: null,
      login: (user) => set({ 
        user,
        isAuthenticated: true,
        loginTime: Date.now()
      }),
      logout: () => set({ user: null, isAuthenticated: false, loginTime: null }),
      checkExpiration: () => {
        const { loginTime, logout } = get();
        if (loginTime) {
          const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
          if (Date.now() - loginTime > expirationTime) {
            logout();
          } else {
            // bump the activity timer
            set({ loginTime: Date.now() });
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
