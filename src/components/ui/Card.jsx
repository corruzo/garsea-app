import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const baseStyles = `rounded-[2.5rem] ${paddingStyles[padding]} transition-all duration-300`;

  // Detectamos si el usuario proporcionó un fondo o borde personalizado
  const hasBg = className.includes('bg-');
  const hasBorder = className.includes('border-');
  const hasShadow = className.includes('shadow-');

  // Sombras más sutiles y profesionales
  const defaultStyles = `${!hasBg ? 'bg-white dark:bg-slate-900' : ''} ${!hasBorder ? 'border-2 border-slate-100 dark:border-slate-800' : ''} ${!hasShadow ? 'shadow-sm' : ''}`;

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
