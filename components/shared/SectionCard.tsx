'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  step?: string;
  title: string;
  icon: LucideIcon;
  accent?: string;
  badge?: string | number;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function SectionCard({
  step,
  title,
  icon: Icon,
  accent = '#00D4AA',
  badge,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-[#30363D] bg-[#161B22] shadow-sm',
        className
      )}
    >
      <header
        className="flex items-center gap-3 border-b border-[#30363D] px-4 py-3"
        style={{ borderLeftWidth: 3, borderLeftColor: accent }}
      >
        {step && (
          <span
            className="font-mono text-[10px] font-bold tracking-widest text-[#8B949E]"
            style={{ color: accent }}
          >
            {step}
          </span>
        )}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="flex-1 text-sm font-semibold tracking-wide text-[#E6EDF3]">
          {title}
        </h2>
        {badge !== undefined && (
          <span
            className="rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {badge}
          </span>
        )}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
