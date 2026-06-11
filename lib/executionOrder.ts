import type { ExecutionStep, SqlClause, ClauseType } from '@/types/sql';
import { SQL_EXECUTION_ORDER } from './constants';

const STEP_DESCRIPTIONS: Record<ClauseType, string> = {
  WITH: 'Evaluate CTEs (Common Table Expressions)',
  FROM: 'Identify source tables and load rows',
  JOIN: 'Combine rows from joined tables',
  WHERE: 'Filter rows based on conditions',
  GROUP_BY: 'Group rows into aggregation buckets',
  HAVING: 'Filter groups based on aggregate conditions',
  SELECT: 'Evaluate expressions and select columns',
  ORDER_BY: 'Sort the result set',
  LIMIT: 'Restrict number of output rows',
  OFFSET: 'Skip the first N rows',
  SUBQUERY: 'Evaluate nested subquery',
};

const STEP_ICONS: Record<ClauseType, string> = {
  WITH: 'GitBranch',
  FROM: 'Database',
  JOIN: 'Link',
  WHERE: 'Filter',
  GROUP_BY: 'Layers',
  HAVING: 'SlidersHorizontal',
  SELECT: 'List',
  ORDER_BY: 'ArrowUpDown',
  LIMIT: 'Scissors',
  OFFSET: 'SkipForward',
  SUBQUERY: 'GitBranch',
};

export const buildExecutionSteps = (clauses: SqlClause[]): ExecutionStep[] => {
  const presentTypes = new Set(clauses.map((c) => c.type));
  const steps: ExecutionStep[] = [];
  let order = 1;

  for (const clauseType of SQL_EXECUTION_ORDER) {
    if (presentTypes.has(clauseType)) {
      steps.push({
        order: order++,
        clause: clauseType,
        description: STEP_DESCRIPTIONS[clauseType] ?? clauseType,
        icon: STEP_ICONS[clauseType] ?? 'Circle',
      });
    }
  }

  return steps;
};
