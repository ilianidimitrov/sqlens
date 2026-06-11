export type ClauseType =
  | 'SELECT'
  | 'FROM'
  | 'JOIN'
  | 'WHERE'
  | 'GROUP_BY'
  | 'HAVING'
  | 'ORDER_BY'
  | 'LIMIT'
  | 'OFFSET'
  | 'SUBQUERY'
  | 'WITH';

export type JoinType =
  | 'INNER JOIN'
  | 'LEFT JOIN'
  | 'RIGHT JOIN'
  | 'FULL OUTER JOIN'
  | 'CROSS JOIN'
  | 'NATURAL JOIN';

export type WarningSeverity = 'error' | 'warning' | 'info';

export interface SqlClause {
  type: ClauseType;
  raw: string;
  explanation: string;
  color: string;
  startIndex: number;
  endIndex: number;
}

export interface TableRef {
  name: string;
  alias?: string;
  color: string;
  isSubquery: boolean;
}

export interface JoinRef {
  type: JoinType;
  leftTable: string;
  rightTable: string;
  condition: string;
  leftColumn: string;
  rightColumn: string;
}

export interface ColumnRef {
  table: string;
  column: string;
  alias?: string;
  isAggregated: boolean;
  aggregateFn?: string;
  clause: ClauseType;
}

export interface SqlWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  description: string;
  suggestion: string;
  affectedClause?: ClauseType;
}

export interface ExecutionStep {
  order: number;
  clause: ClauseType;
  description: string;
  icon: string;
}

export interface ParsedQuery {
  raw: string;
  isValid: boolean;
  errorMessage?: string;
  dialect: 'MySQL' | 'PostgreSQL' | 'SQLite' | 'Generic';
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'UNKNOWN';
  clauses: SqlClause[];
  tables: TableRef[];
  joins: JoinRef[];
  columns: ColumnRef[];
  warnings: SqlWarning[];
  executionSteps: ExecutionStep[];
  humanReadable: string;
  complexity: 'simple' | 'moderate' | 'complex';
  subqueryCount: number;
}

