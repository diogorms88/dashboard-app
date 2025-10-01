'use client'

import { LayoutContent } from './layout-content'
import { ReactNode } from 'react'

interface ClientLayoutContentProps {
  children: ReactNode
}

export function ClientLayoutContent({ children }: ClientLayoutContentProps) {
  return <LayoutContent>{children}</LayoutContent>
}