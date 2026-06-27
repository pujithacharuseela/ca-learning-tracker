import React, { createContext, useContext, useEffect, useState } from "react"
import { getProfile, login as apiLogin, register as apiRegister } from "@/api/auth"
import { getAccessToken, setTokens, clearTokens } from "@/api/client"
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

  const checkAuth = async () => {
    const token = getAccessToken()
    if (token) {
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logOutLocal()
        }
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const logOutLocal = () => {
    clearTokens()
    setUser(null)
  }

  const login = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await apiLogin(data)
      setTokens(res.accessToken, res.refreshToken)
      setUser(res.user)
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
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    logOutLocal()
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
