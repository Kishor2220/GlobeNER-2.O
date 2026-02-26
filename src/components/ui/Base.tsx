import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm", className)}>
    {children}
  </div>
);

export const Button = ({ children, onClick, className, disabled, variant = 'primary' }: any) => {
  const variants: any = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
    outline: 'border border-zinc-700 hover:bg-zinc-800 text-zinc-400',
    ghost: 'hover:bg-zinc-800 text-zinc-400'
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    default: 'bg-zinc-800 text-zinc-400',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold", variants[variant])}>
      {children}
    </span>
  );
};
