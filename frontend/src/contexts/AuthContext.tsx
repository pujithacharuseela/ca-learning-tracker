import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getProfile, login as apiLogin, register as apiRegister } from "@/api/auth"
import { getAccessToken, setTokens, clearTokens, hasTokens } from "@/api/client"
import { User, LoginRequest, RegisterRequest } from "@/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Track whether we have tokens — even if profile fetch fails, user is still "authenticated"
  const [hasValidTokens, setHasValidTokens] = useState(() => hasTokens())

  const checkAuth = useCallback(async () => {
    const token = getAccessToken()
    if (token) {
      setHasValidTokens(true)
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Only clear tokens for explicit auth failures
          clearTokens()
          setUser(null)
          setHasValidTokens(false)
        }
        // For network errors (timeout, 502, etc.), keep the user "authenticated"
        // with tokens intact. The profile will be loaded when the server comes back.
      }
    } else {
      setHasValidTokens(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await apiLogin(data)
      setTokens(res.accessToken, res.refreshToken)
      setUser(res.user)
      setHasValidTokens(true)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      const res = await apiRegister(data)
      setTokens(res.accessToken, res.refreshToken)
      setUser(res.user)
      setHasValidTokens(true)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    setHasValidTokens(false)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: hasValidTokens,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
