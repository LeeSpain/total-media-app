import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface KnowledgeEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const categories = [
  { value: 'product', label: 'Product Information' },
  { value: 'audience', label: 'Target Audience' },
  { value: 'competitor', label: 'Competitor Intel' },
  { value: 'brand', label: 'Brand Guidelines' },
  { value: 'research', label: 'Research & Insights' },
  { value: 'general', label: 'General Knowledge' },
]

export function KnowledgeEditor({ open, onOpenChange, onSuccess }: KnowledgeEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentBusiness } = useBusiness()

  const handleSubmit = async () => {
    if (!currentBusiness || !title || !content) return

    setIsSubmitting(true)
    try {
      // Add to knowledge base via embeddings service
      const { error } = await supabase.functions.invoke('embeddings', {
        body: {
          action: 'add_knowledge',
          businessId: currentBusiness.id,
          title,
          content,
          category,
          source: 'manual',
        },
      })

      if (error) throw error

      toast.success('Knowledge added successfully!')
      setTitle('')
      setContent('')
      setCategory('general')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error adding knowledge:', error)
      toast.error('Failed to add knowledge')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Knowledge</DialogTitle>
          <DialogDescription>
            Add information that helps the AI agents understand your business better.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Main Product Features"
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add detailed information that will help the AI agents..."
              className="h-48"
            />
            <p className="text-xs text-muted-foreground">
              This content will be embedded and used by agents to make better decisions.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title || !content}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Knowledge'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
