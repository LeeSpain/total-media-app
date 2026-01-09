import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Search, Eye, Pen, Palette, Radio, MessageCircle, BarChart3 } from 'lucide-react'
import { cn, getAgentColor, formatRelativeTime } from '@/lib/utils'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'

interface Activity {
  id: string
  agent: string
  action: string
  details: string
  timestamp: string
}

const agentIcons: Record<string, typeof Bot> = {
  commander: Bot,
  scout: Search,
  spy: Eye,
  writer: Pen,
  artist: Palette,
  broadcaster: Radio,
  ambassador: MessageCircle,
  oracle: BarChart3,
}

export function AgentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const { currentBusiness } = useBusiness()

  useEffect(() => {
    if (!currentBusiness) return

    // Fetch recent agent messages
    const fetchActivities = async () => {
      const { data } = await supabase
        .from('agent_messages')
        .select('*, tasks!inner(business_id)')
        .eq('tasks.business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setActivities(
          data.map((m) => ({
            id: m.id,
            agent: m.from_agent_id,
            action: 'Activity',
            details: m.message,
            timestamp: m.created_at,
          }))
        )
      }
    }

    fetchActivities()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('agent-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        (payload) => {
          setActivities((prev) => [
            {
              id: payload.new.id,
              agent: payload.new.from_agent_id,
              action: 'Activity',
              details: payload.new.message,
              timestamp: payload.new.created_at,
            },
            ...prev.slice(0, 19),
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentBusiness])

  // Demo activities if none exist
  const displayActivities = activities.length > 0 ? activities : [
    { id: '1', agent: 'commander', action: 'Ready', details: 'Awaiting instructions', timestamp: new Date().toISOString() },
    { id: '2', agent: 'scout', action: 'Standby', details: 'Ready to find leads', timestamp: new Date().toISOString() },
    { id: '3', agent: 'writer', action: 'Standby', details: 'Ready to create content', timestamp: new Date().toISOString() },
  ]

  return (
    <Card className="h-[400px]">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Agent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-4">
          <div className="space-y-3 pb-4">
            {displayActivities.map((activity) => {
              const Icon = agentIcons[activity.agent] || Bot
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      getAgentColor(activity.agent)
                    )}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{activity.agent}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
