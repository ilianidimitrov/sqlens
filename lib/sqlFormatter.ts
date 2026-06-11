import { SQL_KEYWORDS } from './constants';

const MAJOR_CLAUSES = [
  'WITH',
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'HAVING',
  'ORDER BY',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
];

export const formatSql = (sql: string): string => {
  let formatted = sql.trim().replace(/\s+/g, ' ');

  for (const kw of [...SQL_KEYWORDS].sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  }

  for (const clause of MAJOR_CLAUSES) {
    const regex = new RegExp(`\\s*\\b${clause.replace(/ /g, '\\s+')}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${clause}`);
  }

  formatted = formatted
    .replace(/\b(INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)\s+JOIN\b/gi, '\n  $&')
    .replace(/\bON\b/gi, '\n    ON')
    .replace(/,\s*/g, ',\n  ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return formatted;
};
