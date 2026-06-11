import type { SqlWarning, TableRef, JoinRef, ColumnRef, SqlClause } from '@/types/sql';

interface WarningInput {
  raw: string;
  ast: Record<string, unknown> | null;
  tables: TableRef[];
  joins: JoinRef[];
  columns: ColumnRef[];
  clauses: SqlClause[];
}

export const detectWarnings = ({
  raw,
  ast,
  tables,
  joins,
  clauses,
}: WarningInput): SqlWarning[] => {
  const warnings: SqlWarning[] = [];

  if (raw.match(/SELECT\s+\*/i)) {
    warnings.push({
      id: 'select-star',
      severity: 'warning',
      title: 'SELECT * used',
      description:
        'Selecting all columns returns unnecessary data and breaks if the table schema changes.',
      suggestion: 'Explicitly list only the columns you need.',
      affectedClause: 'SELECT',
    });
  }

  if (tables.length > 1 && joins.length === 0 && !raw.toUpperCase().includes('JOIN')) {
    warnings.push({
      id: 'implicit-cross-join',
      severity: 'error',
      title: 'Implicit CROSS JOIN detected',
      description:
        'Using comma-separated tables without JOIN produces a cartesian product. This is almost always unintentional.',
      suggestion: 'Use explicit JOIN syntax with an ON condition.',
      affectedClause: 'FROM',
    });
  }

  const astType = String(ast?.type ?? '').toUpperCase();
  if ((astType === 'UPDATE' || astType === 'DELETE') && !ast?.where) {
    warnings.push({
      id: 'missing-where',
      severity: 'error',
      title: 'No WHERE clause on ' + astType,
      description: 'This query will affect ALL rows in the table.',
      suggestion: 'Add a WHERE clause to limit affected rows.',
      affectedClause: 'WHERE',
    });
  }

  const hasHaving = clauses.some((c) => c.type === 'HAVING');
  const hasGroupBy = clauses.some((c) => c.type === 'GROUP_BY');
  if (hasHaving && !hasGroupBy) {
    warnings.push({
      id: 'having-without-group',
      severity: 'warning',
      title: 'HAVING without GROUP BY',
      description: 'HAVING is meant to filter groups. Without GROUP BY it behaves like WHERE.',
      suggestion: 'Use WHERE instead of HAVING if you are not grouping, or add GROUP BY.',
      affectedClause: 'HAVING',
    });
  }

  const hasOrderBy = clauses.some((c) => c.type === 'ORDER_BY');
  const hasLimit = clauses.some((c) => c.type === 'LIMIT');
  if (hasOrderBy && !hasLimit && tables.length > 1) {
    warnings.push({
      id: 'order-without-limit',
      severity: 'info',
      title: 'ORDER BY without LIMIT',
      description: 'Sorting a large joined result set without LIMIT can be expensive.',
      suggestion: 'Consider adding LIMIT if you only need the top N results.',
      affectedClause: 'ORDER_BY',
    });
  }

  if (raw.match(/SELECT[^(]*\(SELECT/i)) {
    warnings.push({
      id: 'subquery-in-select',
      severity: 'warning',
      title: 'Subquery in SELECT list',
      description:
        'A correlated subquery in the SELECT list executes once per row, which can cause N+1 performance issues.',
      suggestion: 'Consider rewriting with a JOIN or a CTE (WITH clause).',
      affectedClause: 'SELECT',
    });
  }

  if (ast?.where) {
    const whereRaw = raw.match(/WHERE\s+([\s\S]+?)(?:GROUP|ORDER|LIMIT|$)/i)?.[1] ?? '';
    const suspectCols = whereRaw.match(/\b(\w+)\s*[=<>!]/g) ?? [];
    suspectCols.forEach((col) => {
      const colName = col.replace(/[=<>!\s]/g, '');
      if (
        colName &&
        !colName.match(/^id$|_id$|^created_at$|^updated_at$/i) &&
        colName.length > 2
      ) {
        warnings.push({
          id: `index-hint-${colName}`,
          severity: 'info',
          title: `Ensure \`${colName}\` is indexed`,
          description: `The column \`${colName}\` is used in WHERE. If not indexed, this causes a full table scan.`,
          suggestion: `Add an index: CREATE INDEX idx_${colName} ON <table>(${colName});`,
          affectedClause: 'WHERE',
        });
      }
    });
  }

  return warnings.filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i);
};
