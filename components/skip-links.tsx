'use client'

import React from 'react'

export function SkipLinks() {
  return (
    <>
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={(e) => {
          e.currentTarget.style.top = '6px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-40px'
        }}
      >
        Pular para o conteúdo principal
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
        style={{ left: '120px' }}
        onFocus={(e) => {
          e.currentTarget.style.top = '6px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-40px'
        }}
      >
        Pular para a navegação
      </a>
    </>
  )
}

// Hook para gerenciar foco em modais
export function useFocusManagement() {
  const focusRef = React.useRef<HTMLElement | null>(null)
  
  const trapFocus = React.useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Permitir que o componente pai lide com o escape
        const escapeEvent = new CustomEvent('modal-escape')
        element.dispatchEvent(escapeEvent)
      }
    }
    
    element.addEventListener('keydown', handleTabKey)
    firstElement?.focus()
    
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }, [])
  
  const restoreFocus = React.useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus()
      focusRef.current = null
    }
  }, [])
  
  const saveFocus = React.useCallback(() => {
    focusRef.current = document.activeElement as HTMLElement
  }, [])
  
  return { trapFocus, restoreFocus, saveFocus }
}

// Componente para anúncios de leitores de tela
export function LiveRegion({ 
  children, 
  politeness = 'polite' 
}: { 
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
}) {
  return (
    <div 
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Hook para anúncios dinâmicos
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('')
  
  const announce = React.useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('')
    setTimeout(() => {
      setAnnouncement(message)
    }, 100)
  }, [])
  
  const AnnouncementRegion = React.useCallback(() => (
    <LiveRegion politeness="polite">
      {announcement}
    </LiveRegion>
  ), [announcement])
  
  return { announce, AnnouncementRegion }
}