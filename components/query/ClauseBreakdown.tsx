'use client';

import { useTranslations } from 'next-intl';
import type { SqlClause, ClauseType } from '@/types/sql';
import { cn } from '@/lib/utils';

interface ClauseBreakdownProps {
  clauses: SqlClause[];
  activeClause: ClauseType | null;
  onClauseHover: (type: ClauseType | null) => void;
}

const formatClauseLabel = (type: ClauseType) => type.replace('_', ' ');

export default function ClauseBreakdown({
  clauses,
  activeClause,
  onClauseHover,
}: ClauseBreakdownProps) {
  const t = useTranslations('clauses');

  if (clauses.length === 0) {
    return <p className="py-6 text-center text-sm text-[#8B949E]">{t('empty')}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {clauses.map((clause, i) => (
          <button
            key={`pill-${clause.type}-${i}`}
            type="button"
            onMouseEnter={() => onClauseHover(clause.type)}
            onMouseLeave={() => onClauseHover(null)}
            className={cn(
              'rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition-all',
              activeClause === clause.type ? '' : 'opacity-70 hover:opacity-100'
            )}
            style={{
              backgroundColor: `${clause.color}20`,
              color: clause.color,
              boxShadow:
                activeClause === clause.type ? `0 0 0 1px ${clause.color}` : undefined,
            }}
          >
            {formatClauseLabel(clause.type)}
          </button>
        ))}
      </div>

      {clauses.map((clause, i) => {
        const isActive = activeClause === clause.type;

        return (
          <div
            key={`${clause.type}-${i}`}
            onMouseEnter={() => onClauseHover(clause.type)}
            onMouseLeave={() => onClauseHover(null)}
            className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 transition-all"
            style={{
              borderLeftWidth: 3,
              borderLeftColor: clause.color,
              boxShadow: isActive ? `0 0 0 1px ${clause.color}50` : undefined,
            }}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className="font-mono text-xs font-bold uppercase tracking-wide"
                style={{ color: clause.color }}
              >
                {formatClauseLabel(clause.type)}
              </span>
              <span className="font-mono text-[10px] text-[#8B949E]">#{i + 1}</span>
            </div>
            <pre className="sql-mono mb-1.5 overflow-x-auto whitespace-pre-wrap text-xs text-[#E6EDF3]">
              {clause.raw}
            </pre>
            <p className="text-xs text-[#8B949E]">{clause.explanation}</p>
          </div>
        );
      })}
    </div>
  );
}
