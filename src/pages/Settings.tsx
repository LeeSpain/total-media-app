import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Save, Loader2, Link2, Twitter, Linkedin, Instagram, Facebook, Mail, CheckCircle, XCircle } from 'lucide-react'

const connections = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-sky-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'email', name: 'Email (Resend)', icon: Mail, color: 'bg-emerald-500' },
]

export default function Settings() {
  const { currentBusiness, updateBusiness } = useBusiness()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: currentBusiness?.name || '',
    website: currentBusiness?.website || '',
    description: currentBusiness?.description || '',
    autonomy_level: currentBusiness?.autonomy_level || 'supervised',
  })

  const handleSave = async () => {
    if (!currentBusiness) return
    
    setSaving(true)
    try {
      await updateBusiness(currentBusiness.id, formData)
      toast.success('Settings saved!')
    } catch (error: unknown) {
      toast.error(`Failed to save: ${(error as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your business and integrations</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="autonomy">Autonomy</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Basic information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Business Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-24"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autonomy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Autonomy Level</CardTitle>
              <CardDescription>How independently should agents operate?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    id: 'supervised', 
                    name: 'Supervised', 
                    desc: 'All actions require your approval before executing. Best for getting started.',
                    badge: 'Recommended'
                  },
                  { 
                    id: 'semi-auto', 
                    name: 'Semi-Autonomous', 
                    desc: 'Routine tasks (scheduling, responding to positive comments) auto-approved. Strategic decisions need approval.' 
                  },
                  { 
                    id: 'full-auto', 
                    name: 'Fully Autonomous', 
                    desc: 'AI operates independently within set guidelines. You receive periodic reports.' 
                  },
                ].map((level) => (
                  <label
                    key={level.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.autonomy_level === level.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="autonomy"
                      value={level.id}
                      checked={formData.autonomy_level === level.id}
                      onChange={(e) => setFormData({ ...formData, autonomy_level: e.target.value })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{level.name}</span>
                        {level.badge && (
                          <Badge variant="secondary" className="text-xs">{level.badge}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{level.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving} className="mt-6">
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Connections</CardTitle>
              <CardDescription>Connect your social media and marketing accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.map((conn) => {
                  const Icon = conn.icon
                  const isConnected = false // Would check actual connection status
                  
                  return (
                    <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${conn.color} flex items-center justify-center`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{conn.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isConnected ? (
                          <>
                            <CheckCircle size={20} className="text-green-500" />
                            <Button variant="outline" size="sm">Disconnect</Button>
                          </>
                        ) : (
                          <Button size="sm">
                            <Link2 size={14} className="mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Platform connections allow Broadcaster to publish content directly to your accounts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              <CardDescription>Define how agents should communicate as your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tone (comma-separated)</label>
                <input
                  type="text"
                  defaultValue={currentBusiness?.brand_voice?.tone?.join(', ') || ''}
                  placeholder="e.g., Warm, Professional, Friendly"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Things to DO</label>
                <Textarea
                  defaultValue={currentBusiness?.brand_voice?.do?.join('\n') || ''}
                  placeholder="One guideline per line"
                  className="h-24"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Things to AVOID</label>
                <Textarea
                  defaultValue={currentBusiness?.brand_voice?.dont?.join('\n') || ''}
                  placeholder="One guideline per line"
                  className="h-24"
                />
              </div>
              <Button>
                <Save size={16} className="mr-2" />
                Save Brand Voice
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
