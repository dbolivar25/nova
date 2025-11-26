"use client"

import { cn } from "@/shared/lib/utils"

interface NovaLoadingProps {
  className?: string
}

/**
 * Nova Loading Animation
 * Three nova-style stars connected by lines, each with expanding glow rings.
 */
export function NovaLoading({ className }: NovaLoadingProps) {
  return (
    <div className={cn("relative h-6 w-16 flex items-center justify-center", className)}>
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 24">
        <line
          x1="12" y1="12" x2="32" y2="12"
          className="stroke-primary/20"
          strokeWidth="1"
          style={{ animation: "constellation-line 2s ease-in-out infinite" }}
        />
        <line
          x1="32" y1="12" x2="52" y2="12"
          className="stroke-primary/20"
          strokeWidth="1"
          style={{ animation: "constellation-line 2s ease-in-out infinite 0.3s" }}
        />
      </svg>

      {/* Star 1 - Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-[nova-ring_2s_ease-out_infinite]" />
        <div className="absolute inset-0.5 rounded-full bg-primary/10 animate-[nova-ring_2s_ease-out_infinite_0.3s]" />
        <div className="relative h-1.5 w-1.5 rounded-full bg-primary animate-[nova-core_2s_ease-in-out_infinite]" />
      </div>

      {/* Star 2 - Center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-[nova-ring_2s_ease-out_infinite_0.15s]" />
        <div className="absolute inset-0.5 rounded-full bg-primary/10 animate-[nova-ring_2s_ease-out_infinite_0.45s]" />
        <div className="relative h-1.5 w-1.5 rounded-full bg-primary animate-[nova-core_2s_ease-in-out_infinite_0.15s]" />
      </div>

      {/* Star 3 - Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-[nova-ring_2s_ease-out_infinite_0.3s]" />
        <div className="absolute inset-0.5 rounded-full bg-primary/10 animate-[nova-ring_2s_ease-out_infinite_0.6s]" />
        <div className="relative h-1.5 w-1.5 rounded-full bg-primary animate-[nova-core_2s_ease-in-out_infinite_0.3s]" />
      </div>

      <style jsx>{`
        @keyframes nova-ring {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes nova-core {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 8px 2px hsl(var(--primary) / 0.4);
          }
          50% {
            transform: scale(1.3);
            box-shadow: 0 0 16px 4px hsl(var(--primary) / 0.6);
          }
        }
        @keyframes constellation-line {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
