import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  organizacion: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setOrganizacion: (organizacion) => set({ organizacion }),
  setLoading: (loading) => set({ loading }),
  
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, organizacion: null })
  },
}))