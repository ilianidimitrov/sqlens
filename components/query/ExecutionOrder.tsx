'use client';

import { useTranslations } from 'next-intl';
import {
  GitBranch,
  Database,
  Link,
  Filter,
  Layers,
  SlidersHorizontal,
  List,
  ArrowUpDown,
  Scissors,
  SkipForward,
  Circle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CLAUSE_COLORS } from '@/lib/constants';
import type { ExecutionStep } from '@/types/sql';
import { cn } from '@/lib/utils';

interface ExecutionOrderProps {
  steps: ExecutionStep[];
  activeStep: number | null;
  onStepHover: (order: number | null) => void;
  isAnimating: boolean;
  onPlay: () => void;
  onReset: () => void;
}

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  GitBranch,
  Database,
  Link,
  Filter,
  Layers,
  SlidersHorizontal,
  List,
  ArrowUpDown,
  Scissors,
  SkipForward,
  Circle,
};

export default function ExecutionOrder({
  steps,
  activeStep,
  onStepHover,
  isAnimating,
  onPlay,
  onReset,
}: ExecutionOrderProps) {
  const t = useTranslations('execution');

  if (steps.length === 0) {
    return <p className="py-4 text-center text-sm text-[#8B949E]">—</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onPlay}
          disabled={isAnimating}
          className="gap-1.5 bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90"
        >
          <Play className="h-3.5 w-3.5" />
          {t('play')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="gap-1.5 border-[#30363D] bg-[#0D1117] hover:bg-[#21262D]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('reset')}
        </Button>
      </div>

      <div className="hidden overflow-x-auto pb-2 lg:block">
        <div className="flex min-w-max items-start gap-0">
          {steps.map((step, i) => {
            const Icon = ICON_MAP[step.icon] ?? Circle;
            const isActive = activeStep === step.order;
            const color = CLAUSE_COLORS[step.clause] ?? '#8B949E';

            return (
              <div key={step.order} className="flex items-start">
                <div
                  onMouseEnter={() => onStepHover(step.order)}
                  onMouseLeave={() => onStepHover(null)}
                  className="w-36 rounded-lg border border-[#30363D] bg-[#0D1117] p-3 transition-all"
                  style={{
                    borderTopWidth: 3,
                    borderTopColor: color,
                    boxShadow: isActive ? `0 0 0 1px ${color}50` : undefined,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                      style={{ backgroundColor: `${color}25`, color }}
                    >
                      {step.order}
                    </span>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <p
                    className="font-mono text-[11px] font-bold uppercase"
                    style={{ color }}
                  >
                    {step.clause.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-[#8B949E]">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex h-12 w-8 items-center justify-center">
                    <div
                      className={cn(
                        'h-0.5 w-full',
                        isAnimating && isActive ? 'bg-[#00D4AA]' : 'bg-[#30363D]'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-0 lg:hidden">
        {steps.map((step, i) => {
          const Icon = ICON_MAP[step.icon] ?? Circle;
          const isActive = activeStep === step.order;
          const color = CLAUSE_COLORS[step.clause] ?? '#8B949E';

          return (
            <div key={step.order} className="relative flex gap-3">
              {i < steps.length - 1 && (
                <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-[#30363D]" />
              )}
              <div
                onMouseEnter={() => onStepHover(step.order)}
                onMouseLeave={() => onStepHover(null)}
                className="relative z-10 mb-2 flex flex-1 gap-3 rounded-lg border border-[#30363D] bg-[#0D1117] p-3"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: color,
                  boxShadow: isActive ? `0 0 0 1px ${color}50` : undefined,
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
                  style={{ backgroundColor: `${color}25`, color }}
                >
                  {step.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                    <span
                      className="font-mono text-xs font-bold uppercase"
                      style={{ color }}
                    >
                      {step.clause.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#8B949E]">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
