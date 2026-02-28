import * as React from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  disabled?: boolean;
}

export function Tooltip({ children, content, position = "top", className, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => !disabled && setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => !disabled && setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && !disabled && (
        <div 
          className={cn(
            "absolute z-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-zinc-900 border border-white/10 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200",
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
