import { Bell, Search, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTaskQueue } from '@/hooks/useTasks'

export function Header() {
  const { user, signOut } = useAuth()
  const { data: queue } = useTaskQueue()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none w-full text-sm"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Task Queue Indicator */}
        {queue && (queue.queued > 0 || queue.running > 0 || queue.review > 0) && (
          <div className="flex items-center gap-3 text-sm">
            {queue.running > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {queue.running} running
              </span>
            )}
            {queue.review > 0 && (
              <span className="flex items-center gap-1.5 text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {queue.review} to review
              </span>
            )}
          </div>
        )}

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell size={20} className="text-muted-foreground" />
          {queue && queue.review > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User size={16} className="text-primary-foreground" />
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.email?.split('@')[0]}</div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Sign out"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
