import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAgents, useAgentStatus } from '@/hooks/useAgents'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Bot, Settings, Play, Pause, Search, Eye, Pen, Palette, Radio, MessageCircle, BarChart3, Loader2, Send } from 'lucide-react'
import { cn, getAgentColor } from '@/lib/utils'

const agentInfo: Record<string, { icon: typeof Bot; description: string; capabilities: string[] }> = {
  commander: {
    icon: Bot,
    description: 'Sets strategy, assigns tasks, reviews work, learns from results',
    capabilities: ['Strategic planning', 'Task orchestration', 'Quality review', 'Performance learning'],
  },
  scout: {
    icon: Search,
    description: 'Discovers leads, scrapes websites, qualifies prospects',
    capabilities: ['Lead discovery', 'Website scraping', 'Contact enrichment', 'Lead scoring'],
  },
  spy: {
    icon: Eye,
    description: 'Monitors competitors, tracks trends, identifies opportunities',
    capabilities: ['Competitor analysis', 'Trend tracking', 'Market research', 'Opportunity spotting'],
  },
  writer: {
    icon: Pen,
    description: 'Creates social posts, emails, blogs, ad copy',
    capabilities: ['Social media posts', 'Email campaigns', 'Blog articles', 'Ad copy'],
  },
  artist: {
    icon: Palette,
    description: 'Generates images, graphics, thumbnails, visual content',
    capabilities: ['Image generation', 'Social graphics', 'Thumbnails', 'Brand visuals'],
  },
  broadcaster: {
    icon: Radio,
    description: 'Publishes to social, sends emails, manages scheduling',
    capabilities: ['Social publishing', 'Email sending', 'Content scheduling', 'Queue management'],
  },
  ambassador: {
    icon: MessageCircle,
    description: 'Responds to comments, handles DMs, nurtures leads',
    capabilities: ['Comment responses', 'DM handling', 'Lead nurturing', 'Social listening'],
  },
  oracle: {
    icon: BarChart3,
    description: 'Tracks metrics, identifies patterns, provides insights',
    capabilities: ['Performance tracking', 'Pattern analysis', 'Campaign reports', 'Optimization tips'],
  },
}

export default function Agents() {
  const { data: agents, isLoading } = useAgents()
  const { currentBusiness } = useBusiness()
  const { data: agentStatus } = useAgentStatus(currentBusiness?.id || '')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestAgent = async () => {
    if (!selectedAgent || !testInput || !currentBusiness) return

    setTestLoading(true)
    setTestResult(null)

    try {
      const { data, error } = await supabase.functions.invoke(selectedAgent, {
        body: {
          action: selectedAgent === 'commander' ? 'chat' : 'test',
          businessId: currentBusiness.id,
          input: { message: testInput, query: testInput },
        },
      })

      if (error) throw error
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error: unknown) {
      toast.error(`Agent error: ${(error as Error).message}`)
      setTestResult(`Error: ${(error as Error).message}`)
    } finally {
      setTestLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Team</h1>
          <p className="text-muted-foreground">Your 8 AI specialists working 24/7</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents?.map((agent) => {
          const info = agentInfo[agent.type]
          const Icon = info?.icon || Bot
          const status = agentStatus?.[agent.type as keyof typeof agentStatus] || 'active'

          return (
            <Card
              key={agent.id}
              className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedAgent(agent.type)}
            >
              <div className={cn('h-2', getAgentColor(agent.type))} />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getAgentColor(agent.type))}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>{agent.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {info?.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn(
                    status === 'working' ? 'border-amber-500 text-amber-500' : 'border-green-500 text-green-500'
                  )}>
                    <span className={cn(
                      'w-2 h-2 rounded-full mr-2',
                      status === 'working' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
                    )} />
                    {status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Agent Test Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && (
                <>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getAgentColor(selectedAgent))}>
                    {(() => {
                      const Icon = agentInfo[selectedAgent]?.icon || Bot
                      return <Icon size={18} />
                    })()}
                  </div>
                  <span className="capitalize">{selectedAgent}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Test this agent with a sample request
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Capabilities</label>
                <div className="flex flex-wrap gap-2">
                  {agentInfo[selectedAgent]?.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Test Input</label>
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder={
                    selectedAgent === 'scout' ? 'e.g., Find care home managers in Madrid' :
                    selectedAgent === 'writer' ? 'e.g., Write 3 social posts about emergency safety' :
                    selectedAgent === 'spy' ? 'e.g., Analyze competitor Teleasistencia' :
                    'Enter your request...'
                  }
                  className="h-24"
                />
              </div>

              <Button onClick={handleTestAgent} disabled={testLoading || !testInput} className="w-full">
                {testLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send to Agent
                  </>
                )}
              </Button>

              {testResult && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Response</label>
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-64">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
