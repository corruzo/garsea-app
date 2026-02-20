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
    set({ user: null, organizacion: null, loading: false })
  },

  initSession: async (authService) => {
    set({ loading: true });
    const result = await authService.getSession();
    if (result.success) {
      set({
        user: result.data.usuario,
        organizacion: result.data.organizacion,
        loading: false
      });
      return true;
    }
    set({ loading: false });
    return false;
  }
}))