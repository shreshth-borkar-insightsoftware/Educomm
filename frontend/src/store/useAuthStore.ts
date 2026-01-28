import { create } from 'zustand'

interface User {
  email: string
  role: string
  userId: number
  firstName: string
  lastName: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initialization: check localStorage for BOTH user and token
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  setAuth: (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user)) // Save the name data
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))