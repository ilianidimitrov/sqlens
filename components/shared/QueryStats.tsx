'use client';

import { Database, Link2, Layers, AlertTriangle } from 'lucide-react';
import type { ParsedQuery } from '@/types/sql';
import { cn } from '@/lib/utils';

interface QueryStatsProps {
  parsed: ParsedQuery;
}

const stats = [
  {
    key: 'tables',
    label: 'Tables',
    icon: Database,
    color: '#79C0FF',
    getValue: (p: ParsedQuery) => p.tables.length,
  },
  {
    key: 'joins',
    label: 'Joins',
    icon: Link2,
    color: '#D2A8FF',
    getValue: (p: ParsedQuery) => p.joins.length,
  },
  {
    key: 'clauses',
    label: 'Clauses',
    icon: Layers,
    color: '#56D364',
    getValue: (p: ParsedQuery) => p.clauses.length,
  },
  {
    key: 'warnings',
    label: 'Warnings',
    icon: AlertTriangle,
    color: '#FFA657',
    getValue: (p: ParsedQuery) => p.warnings.length,
  },
] as const;

export default function QueryStats({ parsed }: QueryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = stat.getValue(parsed);
        const highlight = stat.key === 'warnings' && value > 0;

        return (
          <div
            key={stat.key}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-[#30363D] bg-[#161B22] px-4 py-3',
              highlight && 'border-[#FFA657]/40 bg-[#FFA657]/5'
            )}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${stat.color}18`, color: stat.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                {stat.label}
              </p>
              <p className="font-mono text-xl font-bold text-[#E6EDF3]">{value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
