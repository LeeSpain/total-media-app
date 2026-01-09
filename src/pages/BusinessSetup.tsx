import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Globe, Sparkles, CheckCircle, Loader2 } from 'lucide-react'

// ICE SOS Lite template
const ICE_SOS_LITE_TEMPLATE = {
  name: 'ICE SOS Lite',
  website: 'https://www.icesoslite.com',
  description: 'Emergency protection platform for elderly people with voice-activated alerts, AI assistant Clara, Bluetooth pendants, and family tracking.',
}

export default function BusinessSetup() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [useTemplate, setUseTemplate] = useState<string | null>(null)
  const { createBusiness } = useBusiness()
  const navigate = useNavigate()

  const applyTemplate = (template: typeof ICE_SOS_LITE_TEMPLATE) => {
    setName(template.name)
    setWebsite(template.website)
    setDescription(template.description)
    setUseTemplate('ice-sos-lite')
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const business = await createBusiness({
        name,
        website,
        description,
        status: 'active',
        autonomy_level: 'supervised',
      })

      // If using ICE SOS Lite template, seed the data
      if (useTemplate === 'ice-sos-lite' && business) {
        await supabase.rpc('seed_ice_sos_lite', { p_business_id: business.id })
        toast.success('Business created with ICE SOS Lite data!')
      } else {
        toast.success('Business created! Your AI team is ready.')
      }
      
      navigate('/app/dashboard')
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 2) * 100

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Set Up Your Business</h1>
        <p className="text-muted-foreground">
          Tell us about your business so the AI agents can help you grow
        </p>
      </div>

      <Progress value={progress} className="mb-8 h-2" />

      {step === 1 && (
        <div className="space-y-6">
          {/* Template Option */}
          <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer"
                onClick={() => applyTemplate(ICE_SOS_LITE_TEMPLATE)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">ICE SOS Lite</h3>
                  <p className="text-sm text-muted-foreground">
                    Use pre-configured template with products, audience, and brand data
                  </p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or start fresh</span>
            </div>
          </div>

          {/* Manual Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Enter your business details manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Business Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-muted text-muted-foreground text-sm">
                    <Globe size={16} />
                  </span>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-r-lg bg-background"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
              <Button onClick={() => setStep(2)} disabled={!name} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>About Your Business</CardTitle>
            <CardDescription>
              {useTemplate ? 'Review and customize the template' : 'Tell us about what you do'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {useTemplate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                <CheckCircle size={16} />
                Using ICE SOS Lite template - products, audience, and brand data will be included
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Business Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-32"
                placeholder="What does your business do? Who are your customers? What makes you unique?"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps the AI agents understand your business and create relevant content
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Business'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
