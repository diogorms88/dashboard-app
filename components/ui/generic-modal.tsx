'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

interface GenericModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  onSave?: () => void | Promise<void>
  onCancel?: () => void
  saveLabel?: string
  cancelLabel?: string
  showFooter?: boolean
  showCloseButton?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function GenericModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  showFooter = true,
  showCloseButton = true,
  size = 'md',
  loading = false,
  disabled = false,
  className
}: GenericModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!onSave || disabled || loading) return

    try {
      setIsSubmitting(true)
      await onSave()
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'lg':
        return 'max-w-4xl'
      case 'xl':
        return 'max-w-6xl'
      case 'full':
        return 'max-w-[95vw] max-h-[95vh]'
      default:
        return 'max-w-2xl'
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${getSizeClass()} ${className || ''}`}
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle id="modal-title">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2" id="modal-description">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {showFooter && (onSave || onCancel) && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={disabled || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saveLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Hook para facilitar o uso do GenericModal
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => {
    if (!loading) {
      setIsOpen(false)
    }
  }

  const withLoading = async (asyncFn: () => Promise<void>) => {
    try {
      setLoading(true)
      await asyncFn()
    } finally {
      setLoading(false)
    }
  }

  return {
    isOpen,
    loading,
    openModal,
    closeModal,
    setLoading,
    withLoading
  }
}

// Componente de confirmação usando GenericModal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false
}: ConfirmModalProps) {
  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSave={onConfirm}
      onCancel={onClose}
      saveLabel={confirmLabel}
      cancelLabel={cancelLabel}
      loading={loading}
      size="sm"
    >
      <div className="py-4">
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </GenericModal>
  )
}