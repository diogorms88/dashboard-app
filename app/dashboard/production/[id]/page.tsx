import { ProductionRecordDetails } from '@/components/production-record-details'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardShell } from '@/components/dashboard-shell'

interface ProductionRecordPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductionRecordPage({ params }: ProductionRecordPageProps) {
  const { id } = await params
  // Não converter para número - IDs do Supabase são UUIDs (strings)
  const recordId = id

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Detalhes do Registro"
        text="Visualize os detalhes completos do registro de produção."
      />
      <div className="grid gap-8">
        <ProductionRecordDetails recordId={recordId} />
      </div>
    </DashboardShell>
  )
}