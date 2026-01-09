import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getAgentColor } from '@/lib/utils'
import { Bot, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'

export function TaskFlowVisualization() {
  const { data: tasks } = useTasks({ limit: 10 })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-500" />
      case 'running':
        return <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      case 'failed':
        return <AlertCircle size={14} className="text-red-500" />
      default:
        return <Clock size={14} className="text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base">Task Flow</CardTitle>
      </CardHeader>
      <CardContent>
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No active tasks</p>
            <p className="text-xs mt-1">Start a campaign to see task flow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, index) => (
              <div key={task.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    getAgentColor(task.assigned_to)
                  )}
                >
                  <Bot size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{task.assigned_to}</p>
                </div>
                {getStatusIcon(task.status)}
                {index < tasks.length - 1 && index < 4 && (
                  <ArrowRight size={14} className="text-muted-foreground ml-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
