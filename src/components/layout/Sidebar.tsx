import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useBusiness } from '@/contexts/BusinessContext'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/agents', icon: Bot, label: 'Agents' },
  { to: '/app/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/app/content', icon: FileText, label: 'Content' },
  { to: '/app/leads', icon: Users, label: 'Leads' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/app/knowledge', icon: Brain, label: 'Knowledge' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { currentBusiness } = useBusiness()

  return (
    <aside
      className={cn(
        'bg-card border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <span className="font-bold text-xl bg-gradient-to-r from-commander to-oracle bg-clip-text text-transparent">
            TotalMedia
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Business Selector */}
      {!collapsed && currentBusiness && (
        <div className="p-4 border-b">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Business
          </div>
          <div className="font-medium truncate">{currentBusiness.name}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                'hover:bg-muted',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Agent Status Indicator */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">Agents Active</span>
          </div>
        </div>
      )}
    </aside>
  )
}
