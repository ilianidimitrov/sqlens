import { CLAUSE_COLORS } from './constants';

const KEYWORD_GROUPS: { pattern: RegExp; color: string }[] = [
  { pattern: /\b(SELECT|DISTINCT)\b/gi, color: CLAUSE_COLORS.SELECT },
  { pattern: /\b(FROM)\b/gi, color: CLAUSE_COLORS.FROM },
  {
    pattern: /\b((?:INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)\s+JOIN|JOIN)\b/gi,
    color: CLAUSE_COLORS.JOIN,
  },
  { pattern: /\b(WHERE|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL)\b/gi, color: CLAUSE_COLORS.WHERE },
  { pattern: /\b(GROUP\s+BY|HAVING)\b/gi, color: CLAUSE_COLORS.GROUP_BY },
  { pattern: /\b(ORDER\s+BY|ASC|DESC)\b/gi, color: CLAUSE_COLORS.ORDER_BY },
  { pattern: /\b(LIMIT|OFFSET)\b/gi, color: CLAUSE_COLORS.LIMIT },
  { pattern: /\b(WITH|AS|OVER|PARTITION\s+BY)\b/gi, color: CLAUSE_COLORS.WITH },
  {
    pattern: /\b(COUNT|SUM|AVG|MIN|MAX|LAG|DATE_FORMAT)\b/gi,
    color: '#C9D1D9',
  },
  {
    pattern: /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g,
    color: '#A8FF78',
  },
  { pattern: /\b(\d+(?:\.\d+)?)\b/g, color: '#A8FF78' },
];

export interface HighlightToken {
  text: string;
  color?: string;
}

export const tokenizeSql = (sql: string): HighlightToken[] => {
  if (!sql) return [];

  const tokens: HighlightToken[] = [];
  let remaining = sql;
  let safety = 0;

  while (remaining.length > 0 && safety++ < 10000) {
    let matched = false;

    for (const group of KEYWORD_GROUPS) {
      group.pattern.lastIndex = 0;
      const match = group.pattern.exec(remaining);
      if (match && match.index === 0) {
        tokens.push({ text: match[0], color: group.color });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const nextSpecial = remaining.search(
        /\b(SELECT|FROM|JOIN|WHERE|GROUP|HAVING|ORDER|LIMIT|OFFSET|WITH|COUNT|SUM|AVG|MIN|MAX|'|")/i
      );
      const chunkLen = nextSpecial <= 0 ? 1 : nextSpecial;
      const chunk = remaining.slice(0, chunkLen);
      tokens.push({ text: chunk });
      remaining = remaining.slice(chunkLen);
    }
  }

  return tokens;
};
