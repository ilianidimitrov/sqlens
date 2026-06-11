import type { TableRef, JoinRef, ColumnRef } from '@/types/sql';

export const buildHumanReadable = (
  ast: Record<string, unknown> | null,
  tables: TableRef[],
  joins: JoinRef[],
  columns: ColumnRef[]
): string => {
  const parts: string[] = [];

  const queryType = String(ast?.type ?? 'SELECT').toUpperCase();

  if (queryType === 'SELECT') {
    const selectedCols = columns.filter((c) => c.clause === 'SELECT');
    const colDesc =
      selectedCols.length === 0
        ? 'all columns'
        : selectedCols
            .slice(0, 5)
            .map((c) => c.alias || c.column)
            .join(', ') +
          (selectedCols.length > 5 ? ` and ${selectedCols.length - 5} more` : '');

    const tableNames = tables
      .map((tbl) => (tbl.alias ? `${tbl.name} (${tbl.alias})` : tbl.name))
      .join(', ');

    parts.push(`Retrieves ${colDesc} from ${tableNames}`);

    if (joins.length > 0) {
      const joinDesc = joins
        .map((j) => `joins ${j.rightTable} on ${j.condition}`)
        .join(', ');
      parts.push(`and ${joinDesc}`);
    }

    if (ast?.where) {
      parts.push('with filtering conditions applied');
    }

    if (ast?.groupby) {
      const groupCols = Array.isArray(ast.groupby)
        ? (ast.groupby as { column?: string; value?: string }[])
            .map((g) => g.column ?? g.value ?? '')
            .filter(Boolean)
            .join(', ')
        : '';
      parts.push(`grouped by ${groupCols}`);
    }

    if (ast?.orderby) {
      const orderCols = Array.isArray(ast.orderby)
        ? (ast.orderby as { expr?: { column?: string }; type?: string }[])
            .map((o) => `${o.expr?.column ?? ''} ${o.type ?? ''}`.trim())
            .filter(Boolean)
            .join(', ')
        : '';
      parts.push(`ordered by ${orderCols}`);
    }

    if (ast?.limit) {
      const limitNode = ast.limit as {
        value?: { value?: string | number }[] | string | number;
      };
      const limitVal = Array.isArray(limitNode?.value)
        ? limitNode.value[0]?.value ?? ''
        : limitNode?.value ?? '';
      parts.push(`limited to ${limitVal} results`);
    }
  } else if (queryType === 'INSERT') {
    parts.push('Inserts new rows into a table');
  } else if (queryType === 'UPDATE') {
    parts.push('Updates existing rows');
  } else if (queryType === 'DELETE') {
    parts.push('Deletes rows from a table');
  }

  return parts.length > 0 ? parts.join(', ') + '.' : '';
};
