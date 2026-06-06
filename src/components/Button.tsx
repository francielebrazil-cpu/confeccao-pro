import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
}

/**
 * Componente de Botão Moderno e Profissional
 * Implementa micro-interações, feedback tátil (escala/pressão) e acessibilidade.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    rightIcon, 
    children, 
    ripple = true,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

    // Variantes de estilo usando Tailwind
    const variants = {
      primary: 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700',
      secondary: 'bg-slate-800 text-white shadow-slate-800/20 hover:bg-slate-900',
      outline: 'bg-white text-slate-700 border border-slate-200 shadow-slate-200/50 hover:bg-slate-50 hover:border-slate-300',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 shadow-none',
      danger: 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600',
      success: 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-2xl',
      icon: 'p-2.5 rounded-xl',
    };

    // Lógica do efeito Ripple (Onda)
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || isLoading) return;

      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      // Chama o onClick original
      if (onClick) onClick(event);
    };

    const removeRipple = (id: number) => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={createRipple}
        className={cn(
          'relative overflow-hidden inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          'shadow-[0_4px_0_0_rgba(0,0,0,0.05)] active:shadow-none', // Sombra de profundidade base
          variants[variant],
          sizes[size],
          className
        )}
        // Animações de micro-interação
        whileHover={{ 
          scale: 1.02, 
          translateY: -1,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
        whileTap={{ 
          scale: 0.98, 
          translateY: 2, // Efeito de afundamento (pressão)
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' 
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30,
          mass: 0.8
        }}
        {...props}
      >
        {/* Efeito Ripple */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.35 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => removeRipple(r.id)}
              className="absolute bg-white/30 rounded-full pointer-events-none"
              style={{
                left: r.x,
                top: r.y,
                width: 20,
                height: 20,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </AnimatePresence>

        {/* Conteúdo do Botão */}
        <div className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </div>

        {/* Loader (se estiver carregando) */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
