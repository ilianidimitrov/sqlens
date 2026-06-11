'use client';

import { useTranslations } from 'next-intl';
import { CLAUSE_COLORS } from '@/lib/constants';
import type { ColumnRef, TableRef } from '@/types/sql';
import { cn } from '@/lib/utils';

interface ColumnListProps {
  columns: ColumnRef[];
  tables: TableRef[];
  activeTable: string | null;
}

export default function ColumnList({ columns, tables, activeTable }: ColumnListProps) {
  const t = useTranslations('columns');

  const grouped = columns.reduce<Record<string, ColumnRef[]>>((acc, col) => {
    const key = col.table || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(col);
    return acc;
  }, {});

  const tableColors = Object.fromEntries(tables.map((tbl) => [tbl.name, tbl.color]));

  if (columns.length === 0) {
    return <p className="py-6 text-center text-sm text-[#8B949E]">{t('empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([tableName, cols]) => {
        const color = tableColors[tableName] ?? '#8B949E';
        const isActive = activeTable === tableName;
        const isDimmed = activeTable !== null && !isActive;

        return (
          <div
            key={tableName}
            className={cn(
              'rounded-lg border border-[#30363D] bg-[#0D1117] p-3 transition-opacity',
              isDimmed && 'opacity-40'
            )}
            style={{ borderLeftWidth: 3, borderLeftColor: color }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs font-bold" style={{ color }}>
                {tableName}
              </span>
              <span className="ml-auto font-mono text-[10px] text-[#8B949E]">
                {cols.length} col{cols.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cols.map((col, i) => (
                <span
                  key={`${col.column}-${col.clause}-${i}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#30363D] px-2 py-1 font-mono text-[11px]"
                  style={{ borderColor: `${CLAUSE_COLORS[col.clause]}30` }}
                >
                  <span className="text-[#A5F3FC]">{col.column}</span>
                  {col.alias && (
                    <span className="text-[#8B949E]">as {col.alias}</span>
                  )}
                  {col.isAggregated && (
                    <span className="text-[#C9D1D9]">
                      ({col.aggregateFn ?? 'agg'})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
