import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './AuthContext'

export interface Business {
  id: string
  user_id: string
  name: string
  website?: string
  description?: string
  logo_url?: string
  products?: Array<{
    id: string
    name: string
    description: string
    price?: string
    features?: string[]
    benefits?: string[]
  }>
  target_audience?: {
    demographics?: Record<string, unknown>
    psychographics?: Record<string, unknown>
    behavior?: Record<string, unknown>
  }
  brand_voice?: {
    tone?: string[]
    personality?: string[]
    do?: string[]
    dont?: string[]
    examples?: Record<string, string[]>
  }
  competitors?: Array<{
    name: string
    website?: string
    strengths?: string[]
    weaknesses?: string[]
    positioning?: string
  }>
  status: 'active' | 'paused' | 'archived'
  autonomy_level: 'supervised' | 'semi-auto' | 'full-auto'
  created_at: string
  updated_at: string
}

interface BusinessContextType {
  businesses: Business[]
  currentBusiness: Business | null
  setCurrentBusiness: (business: Business | null) => void
  isLoading: boolean
  createBusiness: (data: Partial<Business>) => Promise<Business>
  updateBusiness: (id: string, data: Partial<Business>) => Promise<Business>
  deleteBusiness: (id: string) => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)

  // Fetch all businesses for the user
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Business[]
    },
    enabled: !!user,
  })

  // Auto-select first business if none selected
  useEffect(() => {
    if (!currentBusiness && businesses.length > 0) {
      setCurrentBusiness(businesses[0])
    }
  }, [businesses, currentBusiness])

  // Persist selected business
  useEffect(() => {
    if (currentBusiness) {
      localStorage.setItem('currentBusinessId', currentBusiness.id)
    }
  }, [currentBusiness])

  // Restore selected business on load
  useEffect(() => {
    const savedId = localStorage.getItem('currentBusinessId')
    if (savedId && businesses.length > 0) {
      const saved = businesses.find((b) => b.id === savedId)
      if (saved) setCurrentBusiness(saved)
    }
  }, [businesses])

  // Create business mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Business>) => {
      if (!user) throw new Error('Not authenticated')

      const { data: business, error } = await supabase
        .from('businesses')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return business as Business
    },
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setCurrentBusiness(business)
    },
  })

  // Update business mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Business> }) => {
      const { data: business, error } = await supabase
        .from('businesses')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return business as Business
    },
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      if (currentBusiness?.id === business.id) {
        setCurrentBusiness(business)
      }
    },
  })

  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      if (currentBusiness?.id === id) {
        setCurrentBusiness(businesses.find((b) => b.id !== id) || null)
      }
    },
  })

  const value: BusinessContextType = {
    businesses,
    currentBusiness,
    setCurrentBusiness,
    isLoading,
    createBusiness: createMutation.mutateAsync,
    updateBusiness: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteBusiness: deleteMutation.mutateAsync,
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
