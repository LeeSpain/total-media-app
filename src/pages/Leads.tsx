import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users, Search, Filter, MoreVertical, Mail, Phone, Globe, Linkedin, Loader2 } from 'lucide-react'
import { useLeads, useLeadStats } from '@/hooks/useLeads'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn, formatRelativeTime, getStatusColor } from '@/lib/utils'

export default function Leads() {
  const { data, isLoading, refetch } = useLeads()
  const { data: stats } = useLeadStats()
  const { currentBusiness } = useBusiness()
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState('')

  const handleDiscoverLeads = async () => {
    if (!currentBusiness || !searchCriteria) return

    setDiscoveryLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('scout', {
        body: {
          action: 'discover',
          businessId: currentBusiness.id,
          input: {
            keywords: searchCriteria.split(',').map(s => s.trim()),
            maxLeads: 10,
          },
        },
      })

      if (error) throw error

      toast.success(`Found ${data?.data?.leadsSaved || 0} leads!`)
      setDiscoveryOpen(false)
      setSearchCriteria('')
      refetch()
    } catch (error: unknown) {
      toast.error(`Discovery failed: ${(error as Error).message}`)
    } finally {
      setDiscoveryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            {stats?.total || 0} leads • {stats?.thisWeek || 0} this week
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button onClick={() => setDiscoveryOpen(true)}>
            <Search size={16} className="mr-2" />
            Discover Leads
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['new', 'contacted', 'engaged', 'qualified', 'converted'].map((status) => (
          <Card key={status}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', getStatusColor(status))} />
                <span className="text-sm capitalize">{status}</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {stats?.byStatus?.[status] || 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : !data?.leads?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No leads yet</h3>
            <p className="text-muted-foreground mb-4">
              Use Scout to discover potential customers
            </p>
            <Button onClick={() => setDiscoveryOpen(true)}>
              <Search size={16} className="mr-2" />
              Start Lead Discovery
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Lead</th>
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Score</th>
                    <th className="text-left p-4 font-medium">Source</th>
                    <th className="text-left p-4 font-medium">Added</th>
                    <th className="text-left p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {lead.email && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={12} /> {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{lead.company || '-'}</p>
                        {lead.job_title && (
                          <p className="text-xs text-muted-foreground">{lead.job_title}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          <span className={cn('w-2 h-2 rounded-full mr-2', getStatusColor(lead.status))} />
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full',
                                lead.score >= 80 ? 'bg-green-500' :
                                lead.score >= 50 ? 'bg-amber-500' : 'bg-gray-500'
                              )}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-sm">{lead.score}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm capitalize">{lead.source}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(lead.created_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Discovery Dialog */}
      <Dialog open={discoveryOpen} onOpenChange={setDiscoveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="text-scout" size={20} />
              Discover Leads
            </DialogTitle>
            <DialogDescription>
              Scout will search for potential customers based on your criteria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Criteria</label>
              <Textarea
                value={searchCriteria}
                onChange={(e) => setSearchCriteria(e.target.value)}
                placeholder="e.g., care home managers, senior living administrators, elderly care coordinators"
                className="h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter keywords separated by commas. Scout will find matching prospects.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscoveryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDiscoverLeads} disabled={discoveryLoading || !searchCriteria}>
              {discoveryLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} className="mr-2" />
                  Find Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
