'use client'

import { ReactNode } from 'react'
import { AuthWrapper } from '@/components/auth-wrapper'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AuthWrapper>{children}</AuthWrapper>
}