import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  glass = false,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-10',
  };

  const baseStyles = `rounded-3xl md:rounded-[2.5rem] ${paddingStyles[padding]} transition-all duration-300`;

  const hasBg = className.includes('bg-');
  const hasBorder = className.includes('border-');
  const hasShadow = className.includes('shadow-');

  const defaultStyles = `${!hasBg ? (glass ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl' : 'bg-white dark:bg-slate-900') : ''} ${!hasBorder ? 'border border-slate-200 dark:border-slate-800' : ''} ${!hasShadow ? 'shadow-sm' : ''}`;

  const hoverStyles = hover
    ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer active:scale-[0.98]'
    : '';

  return (
    <div
      className={`${defaultStyles} ${baseStyles} ${hoverStyles} ${className} overflow-hidden`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
