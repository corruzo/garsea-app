import React from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-2xl glass backdrop-blur-lg shadow-soft
        bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-700
        hover:bg-white dark:hover:bg-gray-800
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-indigo-400
        active:scale-95
        ${className}
      `}
      aria-label="Cambiar tema"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative w-6 h-6">
        <SunIcon 
          className={`
            absolute inset-0 w-6 h-6 text-yellow-400 drop-shadow-sm
            transition-all duration-300
            ${theme === 'dark' ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        <MoonIcon 
          className={`
            absolute inset-0 w-6 h-6 text-indigo-400 drop-shadow-sm
            transition-all duration-300
            ${theme === 'light' ? 'opacity-0 -rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
