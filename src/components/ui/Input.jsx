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
    <div className={`w-full ${className} mb-2`} style={{ WebkitTapHighlightColor: 'transparent' }}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 flex items-center justify-center pointer-events-none z-10">
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
            w-full px-6 py-4
            ${icon ? 'pl-14' : ''}
            bg-white/80 dark:bg-gray-700/80 glass backdrop-blur-lg
            border border-gray-200 dark:border-gray-700
            rounded-2xl shadow-soft
            text-base font-semibold
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fadeIn">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
