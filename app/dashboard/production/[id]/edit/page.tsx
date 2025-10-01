'use client'

import { ProductionEditForm } from '@/components/production-edit-form'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardShell } from '@/components/dashboard-shell'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProductionEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductionEditPage({ params }: ProductionEditPageProps) {
  const router = useRouter()
  const [recordId, setRecordId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setRecordId(id)
    }
    getParams()
  }, [params])

  const handleClose = () => {
    router.push('/dashboard/production')
  }

  if (!recordId) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Editar Registro"
        text="Edite as informações do registro de produção."
      />
      <div className="grid gap-8">
        <ProductionEditForm 
          recordId={recordId} 
          onClose={handleClose}
        />
      </div>
    </DashboardShell>
  )
}