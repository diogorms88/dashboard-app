'use client'

import { AuthProvider } from '@/hooks/use-auth'
import { ReactNode } from 'react'

interface ClientAuthProviderProps {
  children: ReactNode
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}