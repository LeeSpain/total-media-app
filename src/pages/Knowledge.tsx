import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Brain, Search, FileText, Users, Target, BarChart3, Trash2 } from 'lucide-react'
import { KnowledgeEditor } from '@/components/knowledge/KnowledgeEditor'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

const categoryIcons: Record<string, typeof Brain> = {
  product: FileText,
  audience: Users,
  competitor: Target,
  brand: Brain,
  research: Search,
  learning: BarChart3,
  general: FileText,
}

const categoryColors: Record<string, string> = {
  product: 'bg-blue-500/20 text-blue-500',
  audience: 'bg-green-500/20 text-green-500',
  competitor: 'bg-red-500/20 text-red-500',
  brand: 'bg-purple-500/20 text-purple-500',
  research: 'bg-amber-500/20 text-amber-500',
  learning: 'bg-cyan-500/20 text-cyan-500',
  general: 'bg-gray-500/20 text-gray-500',
}

export default function Knowledge() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()

  const { data: knowledge, isLoading } = useQuery({
    queryKey: ['knowledge', currentBusiness?.id, selectedCategory],
    queryFn: async () => {
      if (!currentBusiness) return []
      let query = supabase
        .from('knowledge')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!currentBusiness,
  })

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('knowledge').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Knowledge deleted')
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
    }
  }

  const categories = ['all', 'product', 'audience', 'competitor', 'brand', 'research', 'learning', 'general']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Information agents use to make decisions</p>
        </div>
        <Button onClick={() => setEditorOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Knowledge
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : !knowledge || knowledge.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedCategory === 'all' ? 'Knowledge base empty' : `No ${selectedCategory} knowledge yet`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add information to help agents make better decisions
                </p>
                <Button onClick={() => setEditorOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Add First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {knowledge.map((item) => {
                const Icon = categoryIcons[item.category] || FileText
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[item.category]}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{item.title}</h3>
                              <Badge variant="outline" className="capitalize text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Added {formatRelativeTime(item.created_at)}</span>
                              <span>Source: {item.source}</span>
                              {item.agent_id && <span>By: {item.agent_id}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <KnowledgeEditor 
        open={editorOpen} 
        onOpenChange={setEditorOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['knowledge'] })}
      />
    </div>
  )
}
