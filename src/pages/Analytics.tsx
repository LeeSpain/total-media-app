import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, TrendingUp, TrendingDown, Users, Eye, Heart, Share2, Loader2 } from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('7d')
  const [analyzing, setAnalyzing] = useState(false)
  const { currentBusiness } = useBusiness()

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['analytics', currentBusiness?.id, timeframe],
    queryFn: async () => {
      if (!currentBusiness) return null
      
      const days = parseInt(timeframe) || 7
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!currentBusiness,
  })

  const handleAnalyze = async () => {
    if (!currentBusiness) return
    
    setAnalyzing(true)
    try {
      const { data, error } = await supabase.functions.invoke('oracle', {
        body: {
          action: 'analyze_performance',
          businessId: currentBusiness.id,
          input: { timeframe },
        },
      })

      if (error) throw error
      toast.success('Analysis complete!')
      refetch()
    } catch (error: unknown) {
      toast.error(`Analysis failed: ${(error as Error).message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  // Calculate summary stats
  const stats = analytics?.reduce((acc, item) => {
    acc[item.metric] = (acc[item.metric] || 0) + item.value
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your marketing performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 size={16} className="mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{stats.impressions?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
                <Eye size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{stats.engagement?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-500/20 text-pink-500">
                <Heart size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shares</p>
                <p className="text-2xl font-bold">{stats.shares?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20 text-green-500">
                <Share2 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold">{stats.leads?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-500">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : !analytics || analytics.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No analytics data yet</h3>
            <p className="text-muted-foreground mb-4">
              Analytics will appear once campaigns are running and content is published
            </p>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              <BarChart3 size={16} className="mr-2" />
              Run First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content Performance</TabsTrigger>
            <TabsTrigger value="channels">By Channel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>Chart visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                        <div>
                          <p className="font-medium">{item.metric}</p>
                          <p className="text-sm text-muted-foreground">{item.channel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['twitter', 'linkedin', 'instagram', 'facebook', 'email'].map((channel) => {
                    const channelStats = analytics.filter(a => a.channel === channel)
                    const total = channelStats.reduce((sum, a) => sum + a.value, 0)
                    return (
                      <div key={channel} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{channel}</span>
                        <span>{total.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
