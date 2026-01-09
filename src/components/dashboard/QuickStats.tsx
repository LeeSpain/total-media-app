import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLeadStats } from '@/hooks/useLeads'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: typeof Users
  color: string
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(change)}% vs last week
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickStats() {
  const { data: leadStats } = useLeadStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Leads"
        value={leadStats?.total || 0}
        change={12}
        icon={Users}
        color="bg-scout/20 text-scout"
      />
      <StatCard
        title="Content Published"
        value={0}
        icon={FileText}
        color="bg-writer/20 text-writer"
      />
      <StatCard
        title="Engagement Rate"
        value="0%"
        icon={TrendingUp}
        color="bg-oracle/20 text-oracle"
      />
      <StatCard
        title="Conversions"
        value={0}
        icon={Target}
        color="bg-green-500/20 text-green-500"
      />
    </div>
  )
}
