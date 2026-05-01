import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => set({
        user, accessToken, refreshToken, isAuthenticated: true
      }),

      updateUser: (user) => set({ user }),

      logout: () => set({
        user: null, accessToken: null, refreshToken: null, isAuthenticated: false
      }),

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'meterflow-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
