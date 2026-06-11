'use client';

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  GitBranch,
  ListTree,
  PlayCircle,
  Table2,
  ShieldAlert,
} from 'lucide-react';
import { parseQuery } from '@/lib/sqlParser';
import type { ParsedQuery, ClauseType } from '@/types/sql';
import QueryInput from '@/components/query/QueryInput';
import ClauseBreakdown from '@/components/query/ClauseBreakdown';
import ExplainPanel from '@/components/query/ExplainPanel';
import TableDiagram from '@/components/query/TableDiagram';
import ExecutionOrder from '@/components/query/ExecutionOrder';
import WarningsPanel from '@/components/query/WarningsPanel';
import ColumnList from '@/components/query/ColumnList';
import ExportPanel from '@/components/query/ExportPanel';
import SectionCard from '@/components/shared/SectionCard';
import QueryStats from '@/components/shared/QueryStats';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const DEFAULT_SQL = `SELECT u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC;`;

const emptyParsed: ParsedQuery = {
  raw: '',
  isValid: false,
  dialect: 'Generic',
  queryType: 'UNKNOWN',
  clauses: [],
  tables: [],
  joins: [],
  columns: [],
  warnings: [],
  executionSteps: [],
  humanReadable: '',
  complexity: 'simple',
  subqueryCount: 0,
};

function HomeContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [sql, setSql] = useState(DEFAULT_SQL);
  const [mounted, setMounted] = useState(false);
  const [activeClause, setActiveClause] = useState<ClauseType | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    const qParam = searchParams.get('q');
    if (qParam) {
      try {
        setSql(atob(qParam));
      } catch {}
    }
  }, [searchParams]);

  const parsedQuery: ParsedQuery = useMemo(
    () => (mounted ? parseQuery(sql) : emptyParsed),
    [sql, mounted]
  );

  const handleSqlChange = useCallback((value: string) => setSql(value), []);
  const handleExample = useCallback((exampleSql: string) => setSql(exampleSql), []);

  const handlePlay = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveStep(1);
    parsedQuery.executionSteps.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(step.order);
        if (i === parsedQuery.executionSteps.length - 1) {
          setTimeout(() => {
            setIsAnimating(false);
            setActiveStep(null);
          }, 800);
        }
      }, i * 800);
    });
  }, [isAnimating, parsedQuery.executionSteps]);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setActiveStep(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <header className="sticky top-0 z-50 border-b border-[#30363D] bg-[#0D1117]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D4AA]/15">
              <Sparkles className="h-5 w-5 text-[#00D4AA]" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-[#E6EDF3]">
                {t('app.title')}
              </h1>
              <p className="hidden text-xs text-[#8B949E] sm:block">{t('app.subtitle')}</p>
            </div>
          </div>
          <ExportPanel query={sql} isValid={parsedQuery.isValid} compact />
        </div>
      </header>

      <div className="flex flex-col xl:flex-row">
        <aside className="w-full shrink-0 border-b border-[#30363D] bg-[#0D1117] xl:sticky xl:top-[57px] xl:h-[calc(100vh-57px)] xl:w-[420px] xl:border-b-0 xl:border-r">
          <div className="flex h-full flex-col p-4 lg:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#00D4AA]">
                01
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B949E]">
                SQL Query
              </span>
            </div>
            <div className="min-h-0 flex-1">
              <QueryInput
                value={sql}
                onChange={handleSqlChange}
                isValid={parsedQuery.isValid}
                errorMessage={parsedQuery.errorMessage}
                onExample={handleExample}
                activeClause={activeClause}
              />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="space-y-5 p-4 lg:p-6">
            {parsedQuery.isValid && <QueryStats parsed={parsedQuery} />}

            <SectionCard
              step="02"
              title="Summary"
              icon={Sparkles}
              accent="#00D4AA"
            >
              <ExplainPanel
                humanReadable={parsedQuery.humanReadable}
                complexity={parsedQuery.complexity}
                queryType={parsedQuery.queryType}
                dialect={parsedQuery.dialect}
                subqueryCount={parsedQuery.subqueryCount}
                isValid={parsedQuery.isValid}
                errorMessage={parsedQuery.errorMessage}
              />
            </SectionCard>

            <SectionCard
              step="03"
              title={t('diagram.title')}
              icon={GitBranch}
              accent="#D2A8FF"
              badge={parsedQuery.tables.length}
              bodyClassName="p-2 sm:p-4"
            >
              <ErrorBoundary>
                <TableDiagram
                  tables={parsedQuery.tables}
                  joins={parsedQuery.joins}
                  columns={parsedQuery.columns}
                  isValid={parsedQuery.isValid}
                  onTableHover={setActiveTable}
                />
              </ErrorBoundary>
            </SectionCard>

            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard
                step="04"
                title={t('clauses.title')}
                icon={ListTree}
                accent="#FF7B72"
                badge={parsedQuery.clauses.length}
                bodyClassName="max-h-[480px] overflow-y-auto"
              >
                <ClauseBreakdown
                  clauses={parsedQuery.clauses}
                  activeClause={activeClause}
                  onClauseHover={setActiveClause}
                />
              </SectionCard>

              <SectionCard
                step="05"
                title={t('columns.title')}
                icon={Table2}
                accent="#A5F3FC"
                badge={parsedQuery.columns.length}
                bodyClassName="max-h-[480px] overflow-y-auto"
              >
                <ColumnList
                  columns={parsedQuery.columns}
                  tables={parsedQuery.tables}
                  activeTable={activeTable}
                />
              </SectionCard>
            </div>

            <SectionCard
              step="06"
              title={t('execution.title')}
              icon={PlayCircle}
              accent="#56D364"
              badge={parsedQuery.executionSteps.length}
            >
              <ErrorBoundary>
                <ExecutionOrder
                  steps={parsedQuery.executionSteps}
                  activeStep={activeStep}
                  onStepHover={setActiveStep}
                  isAnimating={isAnimating}
                  onPlay={handlePlay}
                  onReset={handleReset}
                />
              </ErrorBoundary>
            </SectionCard>

            <SectionCard
              step="07"
              title={t('warnings.title')}
              icon={ShieldAlert}
              accent={parsedQuery.warnings.length > 0 ? '#FFA657' : '#56D364'}
              badge={parsedQuery.warnings.length}
            >
              <WarningsPanel warnings={parsedQuery.warnings} />
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1117]" />}>
      <HomeContent />
    </Suspense>
  );
}
