'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SqlWarning } from '@/types/sql';
import { cn } from '@/lib/utils';

interface WarningsPanelProps {
  warnings: SqlWarning[];
}

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

const severityConfig = {
  error: {
    icon: AlertCircle,
    className: 'warn-error',
    color: 'text-[#FF7B72]',
    badge: 'bg-[#FF7B72]/20 text-[#FF7B72]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'warn-warning',
    color: 'text-[#FFA657]',
    badge: 'bg-[#FFA657]/20 text-[#FFA657]',
  },
  info: {
    icon: Info,
    className: 'warn-info',
    color: 'text-[#58A6FF]',
    badge: 'bg-[#58A6FF]/20 text-[#58A6FF]',
  },
};

export default function WarningsPanel({ warnings }: WarningsPanelProps) {
  const t = useTranslations('warnings');

  const sorted = [...warnings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#56D364]/30 bg-[#56D364]/10 p-4">
        <CheckCircle2 className="h-5 w-5 text-[#56D364]" />
        <span className="text-sm text-[#56D364]">{t('none')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((warning, i) => {
        const config = severityConfig[warning.severity];
        const Icon = config.icon;

        return (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'rounded-lg border border-[#30363D] bg-[#161B22] p-4 pl-5',
              config.className
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.color)} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#E6EDF3]">{warning.title}</span>
                  <Badge variant="outline" className={cn('text-xs', config.badge)}>
                    {t(`severities.${warning.severity}`)}
                  </Badge>
                  {warning.affectedClause && (
                    <Badge variant="outline" className="text-xs text-[#8B949E]">
                      {warning.affectedClause.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[#8B949E]">{warning.description}</p>
                <p className="text-sm italic text-[#E6EDF3]/70">{warning.suggestion}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
