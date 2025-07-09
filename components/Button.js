// components/Button.js
'use client';

import { cn } from '@/utils/classNames';

export function Button({ label, onClick, disabled, isLoading, variant = 'primary', iconLeft, className }) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium transition';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(base, variants[variant], className, {
        'opacity-50 cursor-not-allowed': disabled || isLoading,
      })}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
      ) : (
        <>
          {iconLeft && <span className="mr-2">{iconLeft}</span>}
          {label}
        </>
      )}
    </button>
  );
}
