import { Parser } from 'node-sql-parser';
import type {
  ParsedQuery,
  TableRef,
  JoinRef,
  ColumnRef,
  SqlClause,
  ClauseType,
  JoinType,
} from '@/types/sql';
import { CLAUSE_COLORS } from './constants';
import { assignTableColors } from './tableColors';
import { buildExecutionSteps } from './executionOrder';
import { detectWarnings } from './sqlWarnings';
import { buildHumanReadable } from './sqlExplainer';

const parser = new Parser();

const CLAUSE_EXPLANATIONS: Record<ClauseType, string> = {
  SELECT: 'Columns to retrieve',
  FROM: 'Source tables',
  JOIN: 'Table relationship',
  WHERE: 'Row filter condition',
  GROUP_BY: 'Aggregation groups',
  HAVING: 'Group filter',
  ORDER_BY: 'Sort direction',
  LIMIT: 'Maximum rows',
  OFFSET: 'Skip rows',
  WITH: 'Common Table Expression',
  SUBQUERY: 'Nested query',
};

export const parseQuery = (sql: string): ParsedQuery => {
  const raw = sql.trim();
  if (!raw) {
    return emptyResult(raw);
  }

  try {
    let ast: Record<string, unknown>;
    let dialect: ParsedQuery['dialect'] = 'MySQL';

    try {
      ast = parser.astify(raw, { database: 'MySQL' }) as unknown as Record<string, unknown>;
    } catch {
      try {
        ast = parser.astify(raw, { database: 'PostgreSQL' }) as unknown as Record<
          string,
          unknown
        >;
        dialect = 'PostgreSQL';
      } catch (e2: unknown) {
        const message = e2 instanceof Error ? e2.message : 'Invalid SQL syntax';
        return {
          ...emptyResult(raw),
          isValid: false,
          errorMessage: message,
        };
      }
    }

    const astNode = (Array.isArray(ast) ? ast[0] : ast) as Record<string, unknown>;
    const queryType = detectQueryType(astNode);
    const tables = extractTables(astNode);
    const tableColorMap = assignTableColors(tables.map((t) => t.name));

    const tablesWithColors: TableRef[] = tables.map((t) => ({
      ...t,
      color: tableColorMap[t.name] ?? '#8B949E',
    }));

    const aliasMap = buildAliasMap(tablesWithColors);
    const joins = extractJoins(astNode, tablesWithColors);
    const columns = extractColumns(astNode, aliasMap);
    const clauses = extractClauses(raw, astNode);
    const warnings = detectWarnings({
      raw,
      ast: astNode,
      tables: tablesWithColors,
      joins,
      columns,
      clauses,
    });
    const executionSteps = buildExecutionSteps(clauses);
    const humanReadable = buildHumanReadable(astNode, tablesWithColors, joins, columns);
    const subqueryCount = countSubqueries(astNode);
    const complexity = calcComplexity(
      tables.length,
      joins.length,
      subqueryCount,
      clauses.length
    );

    return {
      raw,
      isValid: true,
      dialect,
      queryType,
      clauses,
      tables: tablesWithColors,
      joins,
      columns,
      warnings,
      executionSteps,
      humanReadable,
      complexity,
      subqueryCount,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Parse error';
    return {
      ...emptyResult(raw),
      isValid: false,
      errorMessage: message,
    };
  }
};

const emptyResult = (raw: string): ParsedQuery => ({
  raw,
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
});

const detectQueryType = (ast: Record<string, unknown>): ParsedQuery['queryType'] => {
  const t = String(ast?.type ?? '').toUpperCase();
  if (t === 'SELECT') return 'SELECT';
  if (t === 'INSERT') return 'INSERT';
  if (t === 'UPDATE') return 'UPDATE';
  if (t === 'DELETE') return 'DELETE';
  if (t === 'CREATE') return 'CREATE';
  if (t === 'DROP') return 'DROP';
  return 'UNKNOWN';
};

const calcComplexity = (
  tableCount: number,
  joinCount: number,
  subqueryCount: number,
  _clauseCount: number
): ParsedQuery['complexity'] => {
  const score = tableCount + joinCount * 2 + subqueryCount * 3;
  if (score <= 3) return 'simple';
  if (score <= 8) return 'moderate';
  return 'complex';
};

const countSubqueries = (ast: unknown, count = 0): number => {
  if (!ast || typeof ast !== 'object') return count;
  const node = ast as Record<string, unknown>;
  if (node.type === 'select' && count > 0) count++;
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        count = countSubqueries(item, count);
      }
    } else if (typeof val === 'object' && val !== null) {
      count = countSubqueries(val, count);
    }
  }
  return count;
};

const buildAliasMap = (tables: TableRef[]): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const t of tables) {
    map[t.name] = t.name;
    if (t.alias) {
      map[t.alias] = t.name;
    }
  }
  return map;
};

const getTableName = (fromItem: Record<string, unknown>): string => {
  if (fromItem.expr && typeof fromItem.expr === 'object') {
    const expr = fromItem.expr as Record<string, unknown>;
    if (expr.type === 'select') {
      return fromItem.as ? String(fromItem.as) : 'subquery';
    }
  }
  return String(fromItem.table ?? fromItem.as ?? 'unknown');
};

const extractTables = (ast: Record<string, unknown>): Omit<TableRef, 'color'>[] => {
  const tables: Omit<TableRef, 'color'>[] = [];
  const seen = new Set<string>();

  const addTable = (name: string, alias?: string, isSubquery = false) => {
    const key = alias ?? name;
    if (!seen.has(key)) {
      seen.add(key);
      tables.push({ name, alias, isSubquery });
    }
  };

  const walkFrom = (fromArr: unknown) => {
    if (!Array.isArray(fromArr)) return;
    for (const item of fromArr) {
      const fromItem = item as Record<string, unknown>;
      if (fromItem.expr && typeof fromItem.expr === 'object') {
        const expr = fromItem.expr as Record<string, unknown>;
        if (expr.type === 'select') {
          addTable('subquery', fromItem.as ? String(fromItem.as) : undefined, true);
          walkFrom(expr.from);
        }
      } else if (fromItem.table) {
        addTable(String(fromItem.table), fromItem.as ? String(fromItem.as) : undefined);
      }
    }
  };

  walkFrom(ast.from);

  if (ast.with && Array.isArray(ast.with)) {
    for (const cte of ast.with as Record<string, unknown>[]) {
      if (cte.stmt && typeof cte.stmt === 'object') {
        const stmt = (cte.stmt as Record<string, unknown>).ast ?? cte.stmt;
        walkFrom((stmt as Record<string, unknown>).from);
      }
    }
  }

  return tables;
};

const normalizeJoinType = (join: string): JoinType => {
  const upper = join.toUpperCase().trim();
  if (upper.includes('LEFT')) return 'LEFT JOIN';
  if (upper.includes('RIGHT')) return 'RIGHT JOIN';
  if (upper.includes('FULL')) return 'FULL OUTER JOIN';
  if (upper.includes('CROSS')) return 'CROSS JOIN';
  if (upper.includes('NATURAL')) return 'NATURAL JOIN';
  return 'INNER JOIN';
};

const exprToString = (expr: unknown): string => {
  if (!expr || typeof expr !== 'object') return '';
  try {
    return parser.exprToSQL(expr as never);
  } catch {
    const node = expr as Record<string, unknown>;
    if (node.type === 'column_ref') {
      const table = node.table ? `${node.table}.` : '';
      return `${table}${node.column ?? ''}`;
    }
    if (node.left && node.right) {
      return `${exprToString(node.left)} ${node.operator ?? '='} ${exprToString(node.right)}`;
    }
    return String(node.value ?? node.column ?? '');
  }
};

const extractJoinCondition = (
  on: unknown
): { condition: string; leftColumn: string; rightColumn: string } => {
  if (!on || typeof on !== 'object') {
    return { condition: '', leftColumn: '', rightColumn: '' };
  }
  const node = on as Record<string, unknown>;
  const condition = exprToString(on);
  let leftColumn = '';
  let rightColumn = '';

  if (node.left && node.right) {
    leftColumn = exprToString(node.left);
    rightColumn = exprToString(node.right);
  }

  return { condition, leftColumn, rightColumn };
};

const extractJoins = (ast: Record<string, unknown>, tables: TableRef[]): JoinRef[] => {
  const joins: JoinRef[] = [];
  const fromArr = ast.from;
  if (!Array.isArray(fromArr) || fromArr.length < 2) return joins;

  let leftTable = getTableName(fromArr[0] as Record<string, unknown>);
  const leftRef = tables.find((t) => t.name === leftTable || t.alias === leftTable);
  if (leftRef) leftTable = leftRef.alias ?? leftRef.name;

  for (let i = 1; i < fromArr.length; i++) {
    const item = fromArr[i] as Record<string, unknown>;
    if (!item.join) continue;

    let rightTable = getTableName(item);
    const rightRef = tables.find((t) => t.name === rightTable || t.alias === rightTable);
    if (rightRef) rightTable = rightRef.alias ?? rightRef.name;

    const { condition, leftColumn, rightColumn } = extractJoinCondition(item.on);

    joins.push({
      type: normalizeJoinType(String(item.join)),
      leftTable,
      rightTable,
      condition,
      leftColumn,
      rightColumn,
    });

    leftTable = rightTable;
  }

  return joins;
};

const walkExprColumns = (
  expr: unknown,
  clause: ClauseType,
  aliasMap: Record<string, string>,
  columns: ColumnRef[],
  isAggregated = false,
  aggregateFn?: string
) => {
  if (!expr || typeof expr !== 'object') return;
  const node = expr as Record<string, unknown>;

  if (node.type === 'column_ref') {
    const tableAlias = node.table ? String(node.table) : '';
    const resolvedTable = aliasMap[tableAlias] ?? tableAlias ?? 'unknown';
    columns.push({
      table: resolvedTable,
      column: String(node.column ?? '*'),
      isAggregated,
      aggregateFn,
      clause,
    });
    return;
  }

  if (node.type === 'aggr_func' || node.type === 'function') {
    const fnName = String(node.name ?? '').toUpperCase();
    if (node.args) {
      if (Array.isArray(node.args)) {
        for (const arg of node.args) walkExprColumns(arg, clause, aliasMap, columns, true, fnName);
      } else if (typeof node.args === 'object') {
        const args = node.args as Record<string, unknown>;
        if (args.expr) walkExprColumns(args.expr, clause, aliasMap, columns, true, fnName);
      }
    }
    return;
  }

  if (node.type === 'binary_expr') {
    walkExprColumns(node.left, clause, aliasMap, columns, isAggregated, aggregateFn);
    walkExprColumns(node.right, clause, aliasMap, columns, isAggregated, aggregateFn);
    return;
  }

  if (node.type === 'select') {
    return;
  }

  for (const key of Object.keys(node)) {
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'object') {
          walkExprColumns(item, clause, aliasMap, columns, isAggregated, aggregateFn);
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      walkExprColumns(val, clause, aliasMap, columns, isAggregated, aggregateFn);
    }
  }
};

const extractColumns = (
  ast: Record<string, unknown>,
  aliasMap: Record<string, string>
): ColumnRef[] => {
  const columns: ColumnRef[] = [];

  if (Array.isArray(ast.columns)) {
    for (const col of ast.columns) {
      const colNode = col as Record<string, unknown>;
      const expr = colNode.expr as Record<string, unknown> | undefined;
      if (expr?.type === 'column_ref' && expr.column === '*') {
        columns.push({
          table: '*',
          column: '*',
          isAggregated: false,
          clause: 'SELECT',
        });
        continue;
      }

      const isAggr = expr?.type === 'aggr_func' || expr?.type === 'function';
      const aggregateFn = isAggr ? String(expr?.name ?? '').toUpperCase() : undefined;

      walkExprColumns(expr, 'SELECT', aliasMap, columns, isAggr, aggregateFn);

      if (colNode.as) {
        const lastCol = columns[columns.length - 1];
        if (lastCol) lastCol.alias = String(colNode.as);
      }
    }
  }

  if (ast.where) walkExprColumns(ast.where, 'WHERE', aliasMap, columns);
  if (ast.having) walkExprColumns(ast.having, 'HAVING', aliasMap, columns);

  if (Array.isArray(ast.groupby)) {
    for (const g of ast.groupby) {
      walkExprColumns(g, 'GROUP_BY', aliasMap, columns);
    }
  }

  if (Array.isArray(ast.orderby)) {
    for (const o of ast.orderby) {
      const orderNode = o as Record<string, unknown>;
      walkExprColumns(orderNode.expr, 'ORDER_BY', aliasMap, columns);
    }
  }

  const seen = new Set<string>();
  return columns.filter((c) => {
    const key = `${c.table}.${c.column}.${c.clause}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const findClauseInRaw = (
  raw: string,
  keyword: string,
  endKeywords: string[]
): { text: string; start: number; end: number } | null => {
  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
  const match = regex.exec(raw);
  if (!match) return null;

  const start = match.index;
  let end = raw.length;

  for (const endKw of endKeywords) {
    const endRegex = new RegExp(`\\b${endKw}\\b`, 'gi');
    endRegex.lastIndex = start + keyword.length;
    const endMatch = endRegex.exec(raw);
    if (endMatch && endMatch.index < end) {
      end = endMatch.index;
    }
  }

  const text = raw.slice(start, end).trim();
  return { text, start, end: start + text.length };
};

const extractClauses = (raw: string, ast: Record<string, unknown>): SqlClause[] => {
  const clauses: SqlClause[] = [];

  const addClause = (type: ClauseType, text: string, start: number, end: number) => {
    if (!text) return;
    clauses.push({
      type,
      raw: text,
      explanation: CLAUSE_EXPLANATIONS[type],
      color: CLAUSE_COLORS[type],
      startIndex: start,
      endIndex: end,
    });
  };

  if (ast.with) {
    const found = findClauseInRaw(raw, 'WITH', ['SELECT']);
    if (found) addClause('WITH', found.text, found.start, found.end);
  }

  if (ast.columns) {
    const found = findClauseInRaw(raw, 'SELECT', [
      'FROM',
      'WHERE',
      'GROUP',
      'HAVING',
      'ORDER',
      'LIMIT',
    ]);
    if (found) addClause('SELECT', found.text, found.start, found.end);
  }

  if (ast.from) {
    const found = findClauseInRaw(raw, 'FROM', ['WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT']);
    if (found) {
      const fromText = found.text;
      const joinRegex = /\b((?:INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)\s+)?JOIN\b/gi;
      const joinMatch = joinRegex.exec(fromText);

      if (joinMatch && joinMatch.index !== undefined) {
        const fromOnly = fromText.slice(0, joinMatch.index).trim();
        addClause('FROM', fromOnly, found.start, found.start + fromOnly.length);

        let joinStart = found.start + joinMatch.index;
        let remaining = fromText.slice(joinMatch.index);
        const joinParts = remaining.split(
          /(?=\b(?:INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)\s+JOIN\b|\bJOIN\b)/i
        );

        for (const part of joinParts) {
          const trimmed = part.trim();
          if (trimmed.match(/\bJOIN\b/i)) {
            addClause('JOIN', trimmed, joinStart, joinStart + trimmed.length);
            joinStart += part.length;
          }
        }
      } else {
        addClause('FROM', fromText, found.start, found.end);
      }
    }
  }

  if (ast.where) {
    const found = findClauseInRaw(raw, 'WHERE', ['GROUP', 'HAVING', 'ORDER', 'LIMIT']);
    if (found) addClause('WHERE', found.text, found.start, found.end);
  }

  if (ast.groupby) {
    const found = findClauseInRaw(raw, 'GROUP BY', ['HAVING', 'ORDER', 'LIMIT']);
    if (found) addClause('GROUP_BY', found.text, found.start, found.end);
  }

  if (ast.having) {
    const found = findClauseInRaw(raw, 'HAVING', ['ORDER', 'LIMIT']);
    if (found) addClause('HAVING', found.text, found.start, found.end);
  }

  if (ast.orderby) {
    const found = findClauseInRaw(raw, 'ORDER BY', ['LIMIT', 'OFFSET']);
    if (found) addClause('ORDER_BY', found.text, found.start, found.end);
  }

  if (ast.limit) {
    const found = findClauseInRaw(raw, 'LIMIT', ['OFFSET', ';']);
    if (found) addClause('LIMIT', found.text, found.start, found.end);
  }

  const offsetMatch = raw.match(/\bOFFSET\b/i);
  if (offsetMatch && offsetMatch.index !== undefined) {
    const start = offsetMatch.index;
    const text = raw.slice(start).replace(/;+\s*$/, '').trim();
    addClause('OFFSET', text, start, start + text.length);
  }

  return clauses.sort((a, b) => a.startIndex - b.startIndex);
};
