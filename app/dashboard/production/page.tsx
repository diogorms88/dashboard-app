'use client'

import { ProductionRecordsList } from '@/components/production-records-list'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardShell } from '@/components/dashboard-shell'

export default function ProductionRecordsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Registros de Produção"
        text="Visualize e gerencie os registros de produção."
      />
      <div className="grid gap-8">
        <ProductionRecordsList />
      </div>
    </DashboardShell>
  )
}