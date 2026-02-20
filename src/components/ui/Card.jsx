import React from 'react';

const Card = ({
  children,
  className = '',
  glass = false,
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseStyles = `rounded-3xl ${paddingStyles[padding]} transition-all duration-300 ${className}`;

  const glassStyles = glass
    ? 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-slate-800/50 shadow-soft'
    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft';

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:-translate-y-2 cursor-pointer active:scale-[0.98] transition-all duration-500'
    : '';

  return (
    <div
      className={`${baseStyles} ${glassStyles} ${hoverStyles} overflow-hidden`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
