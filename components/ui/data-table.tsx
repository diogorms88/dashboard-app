'use client'

import React, { useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
  emptyMessage?: string
  onRefresh?: () => void
  onRowClick?: (item: T, index: number) => void
  className?: string
  showHeader?: boolean
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  error = null,
  title,
  description,
  emptyMessage = 'Nenhum registro encontrado.',
  onRefresh,
  onRowClick,
  className,
  showHeader = true
}: DataTableProps<T>) {
  // Componente de loading
  const LoadingContent = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-2">
          {columns.map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )

  // Componente de erro
  const ErrorContent = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <p className="text-red-600 font-medium">Erro ao carregar dados</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
      {onRefresh && (
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  )

  // Componente de dados vazios
  const EmptyContent = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
      {onRefresh && (
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      )}
    </div>
  )

  // Renderizar valor da célula
  const renderCellValue = useCallback((column: Column<T>, item: T, index: number) => {
    if (column.render) {
      return column.render(item[column.key as keyof T], item, index)
    }

    const value = item[column.key as keyof T]
    
    // Renderização padrão para diferentes tipos
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      )
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString()}</span>
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      )
    }
    
    return <span>{String(value)}</span>
  }, [])

  const content = () => {
    if (loading) {
      return <LoadingContent />
    }

    if (error) {
      return <ErrorContent />
    }

    if (!data || data.length === 0) {
      return <EmptyContent />
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={() => onRowClick?.(item, rowIndex)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.className}>
                  {renderCellValue(column, item, rowIndex)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (!showHeader && !title) {
    return (
      <div className={className}>
        {content()}
      </div>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'p-0'}>
        {content()}
      </CardContent>
    </Card>
  )
}

export default memo(DataTable) as <T extends Record<string, unknown>>(props: DataTableProps<T>) => JSX.Element

// Manter a exportação nomeada para compatibilidade
export { DataTable }