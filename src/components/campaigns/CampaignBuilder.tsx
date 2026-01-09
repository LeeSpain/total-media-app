import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Bot, Target, MessageSquare, Share2, BarChart3, Loader2, CheckCircle } from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface CampaignBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  { id: 'goal', title: 'Campaign Goal', icon: Target },
  { id: 'audience', title: 'Target Audience', icon: MessageSquare },
  { id: 'channels', title: 'Channels', icon: Share2 },
  { id: 'review', title: 'Review & Launch', icon: BarChart3 },
]

const channelOptions = [
  { id: 'twitter', name: 'Twitter/X', emoji: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼' },
  { id: 'instagram', name: 'Instagram', emoji: '📸' },
  { id: 'facebook', name: 'Facebook', emoji: '👥' },
  { id: 'email', name: 'Email', emoji: '📧' },
  { id: 'blog', name: 'Blog', emoji: '📝' },
]

export function CampaignBuilder({ open, onOpenChange }: CampaignBuilderProps) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { currentBusiness } = useBusiness()

  const handleChannelToggle = (channelId: string) => {
    setChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId]
    )
  }

  const handleCreate = async () => {
    if (!currentBusiness) return
    
    setIsCreating(true)
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          business_id: currentBusiness.id,
          name: `Campaign: ${goal.slice(0, 50)}`,
          goal,
          target_audience: audience,
          channels,
          status: 'planning',
          created_by: 'human',
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Ask Commander to create a plan
      await supabase.functions.invoke('commander', {
        body: {
          action: 'plan_campaign',
          businessId: currentBusiness.id,
          input: {
            goal,
            channels,
            audience,
            campaignId: campaign.id,
          },
        },
      })

      toast.success('Campaign created! Commander is building your strategy.')
      onOpenChange(false)
      
      // Reset form
      setStep(0)
      setGoal('')
      setAudience('')
      setChannels([])
    } catch (error) {
      console.error('Campaign creation error:', error)
      toast.error('Failed to create campaign')
    } finally {
      setIsCreating(false)
    }
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-commander" />
            Create Campaign
          </DialogTitle>
          <DialogDescription>
            Tell Commander what you want to achieve. The AI team will handle the rest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {steps.map((s, i) => (
                <span
                  key={s.id}
                  className={i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}
                >
                  {s.title}
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          {step === 0 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">What's your campaign goal?</label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Generate 50 qualified leads for our emergency protection service targeting adult children of elderly parents"
                className="h-32"
              />
              <p className="text-xs text-muted-foreground">
                Be specific! The more detail you provide, the better Commander can plan.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Who are you targeting?</label>
              <Textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Adults aged 35-55 who have elderly parents, care home managers, senior living community administrators"
                className="h-32"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Which channels should we use?</label>
              <div className="grid grid-cols-3 gap-3">
                {channelOptions.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelToggle(channel.id)}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      channels.includes(channel.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{channel.emoji}</span>
                    <p className="text-sm mt-1">{channel.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Goal</span>
                  <p className="text-sm">{goal}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Audience</span>
                  <p className="text-sm">{audience}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Channels</span>
                  <p className="text-sm">
                    {channels.map((c) => channelOptions.find((o) => o.id === c)?.name).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle size={16} className="text-green-500" />
                Commander will create a detailed strategy and assign tasks to the team
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && !goal) ||
                (step === 1 && !audience) ||
                (step === 2 && channels.length === 0)
              }
            >
              Continue
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Launch Campaign'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
