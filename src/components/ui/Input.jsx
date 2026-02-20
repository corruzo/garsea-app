import React from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className} mb-4`}>
      {label && (
        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-widest px-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none z-10">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3
            ${icon ? 'pl-11' : 'pl-4'}
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-xl shadow-sm
            text-sm font-bold
            text-slate-900 dark:text-white
            placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600
            disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-500/20' : ''}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5 animate-fadeIn px-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
