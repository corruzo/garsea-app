import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'dark' o 'light'
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),
      
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'garsea-theme-storage',
    }
  )
);
