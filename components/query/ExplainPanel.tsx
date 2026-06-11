'use client';

import { useTranslations } from 'next-intl';
import type { ParsedQuery } from '@/types/sql';

interface ExplainPanelProps {
  humanReadable: string;
  complexity: ParsedQuery['complexity'];
  queryType: ParsedQuery['queryType'];
  dialect: ParsedQuery['dialect'];
  subqueryCount: number;
  isValid: boolean;
  errorMessage?: string;
}

const complexityConfig: Record<
  ParsedQuery['complexity'],
  { color: string; bg: string }
> = {
  simple: { color: '#56D364', bg: '#56D36415' },
  moderate: { color: '#FFA657', bg: '#FFA65715' },
  complex: { color: '#FF7B72', bg: '#FF7B7215' },
};

export default function ExplainPanel({
  humanReadable,
  complexity,
  queryType,
  dialect,
  subqueryCount,
  isValid,
  errorMessage,
}: ExplainPanelProps) {
  const t = useTranslations('explain');
  const cfg = complexityConfig[complexity];

  if (!isValid) {
    return (
      <p className="text-sm text-red-400">{errorMessage ?? t('noQuery')}</p>
    );
  }

  const meta = [
    { label: 'Type', value: queryType, color: '#58A6FF' },
    { label: 'Dialect', value: dialect, color: '#79C0FF' },
    {
      label: 'Complexity',
      value: t(`complexity.${complexity}`),
      color: cfg.color,
    },
    ...(subqueryCount > 0
      ? [{ label: 'Subqueries', value: String(subqueryCount), color: '#FFD700' }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-[#E6EDF3]">
        {humanReadable || t('noQuery')}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {meta.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[#30363D] px-3 py-2"
            style={{ backgroundColor: `${item.color}08` }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B949E]">
              {item.label}
            </p>
            <p
              className="mt-0.5 font-mono text-sm font-semibold"
              style={{ color: item.color }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
