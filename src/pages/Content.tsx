import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileText, Image, Mail, Pen, Loader2, Eye, Edit, Trash2, Send } from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn, formatRelativeTime, getStatusColor } from '@/lib/utils'

const contentTypeIcons: Record<string, typeof FileText> = {
  social_post: Pen,
  blog_article: FileText,
  email: Mail,
  image: Image,
}

export default function Content() {
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState('social_post')
  const [createChannel, setCreateChannel] = useState('twitter')
  const [createTopic, setCreateTopic] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', currentBusiness?.id, selectedTab],
    queryFn: async () => {
      if (!currentBusiness) return []
      let query = supabase
        .from('content')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
      
      if (selectedTab !== 'all') {
        query = query.eq('status', selectedTab)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!currentBusiness,
  })

  const handleCreate = async () => {
    if (!currentBusiness || !createTopic) return

    setCreateLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('writer', {
        body: {
          action: createType === 'social_post' ? 'social_posts' : createType === 'email' ? 'email' : 'blog',
          businessId: currentBusiness.id,
          input: {
            channel: createChannel,
            topic: createTopic,
            count: 3,
          },
        },
      })

      if (error) throw error

      toast.success('Content created! Awaiting review.')
      setCreateOpen(false)
      setCreateTopic('')
      queryClient.invalidateQueries({ queryKey: ['content'] })
    } catch (error: unknown) {
      toast.error(`Creation failed: ${(error as Error).message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-muted-foreground">Created by Writer agent</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-2" />
          Create Content
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : !content || content.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No content yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create content with the Writer agent
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Create Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {content.map((item) => {
                const Icon = contentTypeIcons[item.type] || FileText
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          item.type === 'social_post' ? 'bg-blue-500/20 text-blue-500' :
                          item.type === 'email' ? 'bg-green-500/20 text-green-500' :
                          'bg-purple-500/20 text-purple-500'
                        )}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.channel}
                            </Badge>
                            <Badge variant="outline" className="capitalize text-xs">
                              <span className={cn('w-2 h-2 rounded-full mr-1', getStatusColor(item.status))} />
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm line-clamp-2">{item.body}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {formatRelativeTime(item.created_at)} by {item.created_by}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit size={14} />
                          </Button>
                          {item.status === 'approved' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
                              <Send size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Content Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="text-writer" size={20} />
              Create Content
            </DialogTitle>
            <DialogDescription>
              Writer will generate content based on your topic
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select value={createType} onValueChange={setCreateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_post">Social Posts</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="blog">Blog Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {createType === 'social_post' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Channel</label>
                  <Select value={createChannel} onValueChange={setCreateChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Topic / Brief</label>
              <Textarea
                value={createTopic}
                onChange={(e) => setCreateTopic(e.target.value)}
                placeholder="e.g., Benefits of voice-activated emergency alerts for seniors living alone"
                className="h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading || !createTopic}>
              {createLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Pen size={16} className="mr-2" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
