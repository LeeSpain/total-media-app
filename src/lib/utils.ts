import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  return format(new Date(date), pattern)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function getAgentColor(agentType: string): string {
  const colors: Record<string, string> = {
    commander: 'bg-commander text-white',
    scout: 'bg-scout text-white',
    spy: 'bg-spy text-white',
    writer: 'bg-writer text-white',
    artist: 'bg-artist text-white',
    broadcaster: 'bg-broadcaster text-white',
    ambassador: 'bg-ambassador text-white',
    oracle: 'bg-oracle text-white',
  }
  return colors[agentType] || 'bg-gray-500 text-white'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Task statuses
    queued: 'bg-gray-500',
    running: 'bg-amber-500',
    review: 'bg-blue-500',
    approved: 'bg-green-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    // Lead statuses
    new: 'bg-blue-500',
    contacted: 'bg-amber-500',
    engaged: 'bg-purple-500',
    qualified: 'bg-green-500',
    converted: 'bg-emerald-500',
    lost: 'bg-gray-500',
    // Content statuses
    draft: 'bg-gray-500',
    published: 'bg-green-500',
    scheduled: 'bg-blue-500',
    // Campaign statuses
    planning: 'bg-blue-500',
    active: 'bg-green-500',
    paused: 'bg-amber-500',
  }
  return colors[status] || 'bg-gray-500'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}
