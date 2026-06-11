import { TABLE_COLOR_PALETTE } from './constants';

export const assignTableColors = (tableNames: string[]): Record<string, string> => {
  const result: Record<string, string> = {};
  const sorted = [...new Set(tableNames)].sort();
  sorted.forEach((name, i) => {
    result[name] = TABLE_COLOR_PALETTE[i % TABLE_COLOR_PALETTE.length]!;
  });
  return result;
};
