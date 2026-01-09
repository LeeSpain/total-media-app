import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Megaphone, Play, Pause, MoreVertical, Target, Users, BarChart3 } from 'lucide-react'
import { CampaignBuilder } from '@/components/campaigns/CampaignBuilder'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatDate } from '@/lib/utils'

export default function Campaigns() {
  const [builderOpen, setBuilderOpen] = useState(false)
  const { currentBusiness } = useBusiness()

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return []
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!currentBusiness,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'planning': return 'bg-blue-500'
      case 'paused': return 'bg-amber-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your marketing campaigns</p>
        </div>
        <Button onClick={() => setBuilderOpen(true)}>
          <Plus size={16} className="mr-2" />
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first campaign to let the AI agents start marketing
            </p>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)} mr-2`} />
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{campaign.goal}</p>
                    
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-muted-foreground" />
                        <span>{campaign.channels?.length || 0} channels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        <span>{campaign.metrics?.leads_generated || 0} leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 size={14} className="text-muted-foreground" />
                        <span>{campaign.metrics?.engagement || 0} engagement</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {campaign.status === 'active' ? (
                      <Button variant="outline" size="sm">
                        <Pause size={14} className="mr-1" />
                        Pause
                      </Button>
                    ) : campaign.status === 'planning' || campaign.status === 'paused' ? (
                      <Button size="sm">
                        <Play size={14} className="mr-1" />
                        {campaign.status === 'planning' ? 'Launch' : 'Resume'}
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>

                {campaign.status === 'active' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Campaign Progress</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampaignBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
    </div>
  )
}
