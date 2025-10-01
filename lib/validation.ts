import { z } from 'zod'
import type { NextRequest, NextResponse } from 'next/server'

// Resultado da validação
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
  message?: string
}

// Função utilitária para validar dados com Zod
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    } else {
      // Formatar erros do Zod para um formato mais amigável
      const errors: Record<string, string[]> = {}
      
      result.error.errors.forEach((error) => {
        const path = error.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(error.message)
      })
      
      return {
        success: false,
        errors,
        message: 'Dados inválidos fornecidos'
      }
    }
  } catch {
    return {
      success: false,
      message: 'Erro interno de validação'
    }
  }
}

// Hook para validação em tempo real em formulários
export function useFormValidation<T>(
  schema: z.ZodSchema<T>
) {
  const validate = (data: unknown): ValidationResult<T> => {
    return validateData(schema, data)
  }
  
  const validateField = (fieldName: string, value: unknown): string[] => {
    try {
      // Criar um schema parcial apenas para o campo específico
      const fieldSchema = schema.pick({ [fieldName]: true } as Record<string, boolean>)
      const result = fieldSchema.safeParse({ [fieldName]: value })
      
      if (!result.success) {
        return result.error.errors
          .filter(error => error.path.includes(fieldName))
          .map(error => error.message)
      }
      
      return []
    } catch {
      return []
    }
  }
  
  return {
    validate,
    validateField
  }
}

// Middleware para validação de APIs
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>
) {
  return (req: NextRequest, res: NextResponse, next: () => void) => {
    const data = req.body;
    const result = validateData(schema, data)
    
    if (!result.success) {
      throw new Error(result.message || 'Dados inválidos')
    }
    
    req.validatedData = result.data!
    next()
  }
}

// Função para sanitizar dados antes da validação
export function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'string') {
    return data.trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value)
    }
    return sanitized
  }
  
  return data
}

// Função para converter erros de validação em mensagens amigáveis
export function formatValidationErrors(
  errors: Record<string, string[]>
): string {
  const messages = Object.entries(errors)
    .map(([field, fieldErrors]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
      return `${fieldName}: ${fieldErrors.join(', ')}`
    })
    .join('; ')
  
  return messages
}

// Validador para IDs UUID
export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Validador para datas
export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

// Validador para números positivos
export const validatePositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value)
}

export const isValidDate = (value: string): boolean => {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

export const isValidPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value)
}