import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBusiness } from '@/contexts/BusinessContext'
import { useTaskQueue, useTasks } from '@/hooks/useTasks'
import { useAgentStatus } from '@/hooks/useAgents'
import { CommandCenter } from '@/components/command-center/CommandCenter'
import { AgentActivityFeed } from '@/components/dashboard/AgentActivityFeed'
import { TaskFlowVisualization } from '@/components/dashboard/TaskFlowVisualization'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { CampaignBuilder } from '@/components/campaigns/CampaignBuilder'
import {
  Bot,
  Play,
  Zap,
  Target,
  MessageSquare,
  Search,
  Eye,
  Pen,
  Palette,
  Radio,
  BarChart3,
} from 'lucide-react'
import { cn, getAgentColor } from '@/lib/utils'
import { Link } from 'react-router-dom'

const agents = [
  { id: 'commander', name: 'Commander', role: 'Strategy', icon: Bot },
  { id: 'scout', name: 'Scout', role: 'Leads', icon: Search },
  { id: 'spy', name: 'Spy', role: 'Intel', icon: Eye },
  { id: 'writer', name: 'Writer', role: 'Content', icon: Pen },
  { id: 'artist', name: 'Artist', role: 'Visual', icon: Palette },
  { id: 'broadcaster', name: 'Broadcaster', role: 'Publish', icon: Radio },
  { id: 'ambassador', name: 'Ambassador', role: 'Engage', icon: MessageSquare },
  { id: 'oracle', name: 'Oracle', role: 'Analytics', icon: BarChart3 },
]

export default function Dashboard() {
  const { currentBusiness, businesses } = useBusiness()
  const { data: queue } = useTaskQueue()
  const { data: agentStatus } = useAgentStatus(currentBusiness?.id || '')
  const [campaignBuilderOpen, setCampaignBuilderOpen] = useState(false)

  if (!currentBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-commander to-oracle flex items-center justify-center">
            <Bot size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to TotalMedia!</h2>
          <p className="text-muted-foreground mb-6">
            {businesses.length === 0
              ? "Let's set up your first business to get your AI team working."
              : 'Select a business to see your dashboard.'}
          </p>
          <Link to="/app/business/setup">
            <Button size="lg">
              <Zap size={18} className="mr-2" />
              {businesses.length === 0 ? 'Set Up Business' : 'Add Another Business'}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{currentBusiness.name}</h1>
          <p className="text-muted-foreground">
            Your AI marketing team is ready •{' '}
            <span className="text-green-500">
              {Object.values(agentStatus || {}).filter((s) => s === 'working').length || 0} agents working
            </span>
          </p>
        </div>
        <Button onClick={() => setCampaignBuilderOpen(true)}>
          <Play size={16} className="mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <QuickStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Command Center */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="command" className="space-y-4">
            <TabsList>
              <TabsTrigger value="command">Command Center</TabsTrigger>
              <TabsTrigger value="agents">Agent Team</TabsTrigger>
            </TabsList>
            
            <TabsContent value="command">
              <CommandCenter />
            </TabsContent>
            
            <TabsContent value="agents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot size={20} />
                    Agent Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {agents.map((agent) => {
                      const status = agentStatus?.[agent.id as keyof typeof agentStatus] || 'active'
                      const Icon = agent.icon
                      return (
                        <div
                          key={agent.id}
                          className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center mb-2 relative',
                              getAgentColor(agent.id)
                            )}
                          >
                            <Icon size={20} />
                            {status === 'working' && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{agent.name}</span>
                          <span className="text-xs text-muted-foreground">{agent.role}</span>
                          <span className={cn(
                            'text-xs mt-1 px-2 py-0.5 rounded-full',
                            status === 'working' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'
                          )}>
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Activity & Tasks */}
        <div className="space-y-6">
          <AgentActivityFeed />
          <TaskFlowVisualization />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm">
              <Search size={14} className="mr-2" />
              Find Leads
            </Button>
            <Button variant="outline" size="sm">
              <Pen size={14} className="mr-2" />
              Create Content
            </Button>
            <Button variant="outline" size="sm">
              <Eye size={14} className="mr-2" />
              Check Competitors
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 size={14} className="mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Builder Modal */}
      <CampaignBuilder open={campaignBuilderOpen} onOpenChange={setCampaignBuilderOpen} />
    </div>
  )
}
