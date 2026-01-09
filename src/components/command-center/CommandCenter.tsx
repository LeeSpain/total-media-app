import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, getAgentColor } from '@/lib/utils'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/integrations/supabase/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: Date
  thinking?: boolean
}

export function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm Commander, your AI marketing strategist. I coordinate the entire agent team to grow your business. What would you like me to help you with today?\n\nI can:\n• Analyze your marketing state\n• Create campaign strategies\n• Find new leads\n• Generate content\n• Monitor competitors\n• Track performance",
      agent: 'commander',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { currentBusiness } = useBusiness()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentBusiness) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const thinkingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        role: 'assistant',
        content: 'Thinking...',
        agent: 'commander',
        timestamp: new Date(),
        thinking: true,
      },
    ])

    try {
      const { data, error } = await supabase.functions.invoke('commander', {
        body: {
          action: 'chat',
          businessId: currentBusiness.id,
          input: { message: input },
        },
      })

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId)
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: data?.data?.response || data?.response || "I've processed your request. Let me know if you need anything else.",
            agent: 'commander',
            timestamp: new Date(),
          },
        ]
      })
    } catch (error) {
      console.error('Commander error:', error)
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId)
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            agent: 'commander',
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getAgentColor('commander'))}>
            <Bot size={18} />
          </div>
          Command Center
          <span className="text-xs font-normal text-muted-foreground ml-2">
            Talk directly to Commander
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'user'
                      ? 'bg-primary'
                      : message.agent
                      ? getAgentColor(message.agent)
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'user' ? (
                    <User size={16} className="text-primary-foreground" />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    message.thinking && 'animate-pulse'
                  )}
                >
                  {message.thinking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Commander anything..."
              className="flex-1 px-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['Analyze my marketing', 'Find leads', 'Create content', 'Check competitors'].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
