import type { TableRef, JoinRef, ColumnRef } from '@/types/sql';

export const NODE_W = 200;
export const NODE_GAP_Y = 40;
export const LAYER_GAP_X = 220;
export const PADDING = 40;

export interface GraphNode {
  id: string;
  table: TableRef;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
  columns: ColumnRef[];
  joinKeys: string[];
}

export interface GraphEdge {
  joinIndex: number;
  join: JoinRef;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  labelX: number;
  labelY: number;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

export const tableId = (table: TableRef) => `${table.name}::${table.alias ?? ''}`;

export const resolveTableKey = (name: string, tables: TableRef[]): string | null => {
  const t = tables.find((tbl) => tbl.alias === name || tbl.name === name);
  return t ? tableId(t) : null;
};

const extractColName = (ref: string) => {
  const cleaned = ref.replace(/`/g, '').trim();
  return cleaned.split('.').pop() ?? cleaned;
};

export const getJoinKeysForTable = (table: TableRef, joins: JoinRef[]): string[] => {
  const keys = new Set<string>();
  const alias = table.alias ?? table.name;
  joins.forEach((join) => {
    if (join.leftTable === alias || join.leftTable === table.name) {
      keys.add(extractColName(join.leftColumn));
    }
    if (join.rightTable === alias || join.rightTable === table.name) {
      keys.add(extractColName(join.rightColumn));
    }
  });
  return [...keys].filter(Boolean);
};

export const getColumnsForTable = (table: TableRef, columns: ColumnRef[]): ColumnRef[] => {
  const seen = new Set<string>();
  const result: ColumnRef[] = [];
  for (const col of columns) {
    if (col.table !== table.name && col.table !== (table.alias ?? '')) continue;
    if (col.column === '*') continue;
    if (seen.has(col.column)) continue;
    seen.add(col.column);
    result.push(col);
  }
  return result;
};

const nodeHeight = (colCount: number) => {
  const shown = Math.min(colCount, 6);
  const extra = colCount > 6 ? 18 : 0;
  return 56 + shown * 20 + extra;
};

export const buildGraphLayout = (
  tables: TableRef[],
  joins: JoinRef[],
  columns: ColumnRef[]
): GraphLayout => {
  if (tables.length === 0) {
    return { nodes: [], edges: [], width: 400, height: 200 };
  }

  const layers = new Map<string, number>();
  const rootId = tableId(tables[0]!);
  layers.set(rootId, 0);

  joins.forEach((join) => {
    const leftId = resolveTableKey(join.leftTable, tables);
    const rightId = resolveTableKey(join.rightTable, tables);
    if (!leftId || !rightId) return;
    const leftLayer = layers.get(leftId) ?? 0;
    if (!layers.has(rightId)) {
      layers.set(rightId, leftLayer + 1);
    } else {
      layers.set(rightId, Math.max(layers.get(rightId)!, leftLayer + 1));
    }
  });

  let maxLayer = 0;
  tables.forEach((table) => {
    const id = tableId(table);
    if (!layers.has(id)) {
      maxLayer++;
      layers.set(id, maxLayer);
    }
    maxLayer = Math.max(maxLayer, layers.get(id)!);
  });

  const byLayer = new Map<number, TableRef[]>();
  tables.forEach((table) => {
    const layer = layers.get(tableId(table)) ?? 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(table);
  });

  const layerX = new Map<number, number>();
  for (let l = 0; l <= maxLayer; l++) {
    layerX.set(l, PADDING + l * (NODE_W + LAYER_GAP_X));
  }

  const nodes: GraphNode[] = [];

  byLayer.forEach((tbls, layer) => {
    const colHeights = tbls.map((t) =>
      nodeHeight(getColumnsForTable(t, columns).length || 1)
    );
    const totalH =
      colHeights.reduce((a, b) => a + b, 0) + (tbls.length - 1) * NODE_GAP_Y;
    let y = PADDING;

    tbls.forEach((table, i) => {
      const cols = getColumnsForTable(table, columns);
      const h = colHeights[i]!;
      if (tbls.length === 1) {
        y = PADDING + Math.max(60, totalH) / 2 - h / 2;
      }
      nodes.push({
        id: tableId(table),
        table,
        x: layerX.get(layer)!,
        y,
        width: NODE_W,
        height: h,
        layer,
        columns: cols,
        joinKeys: getJoinKeysForTable(table, joins),
      });
      if (tbls.length > 1) y += h + NODE_GAP_Y;
    });
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const edges: GraphEdge[] = joins
    .map((join, joinIndex) => {
      const fromId = resolveTableKey(join.leftTable, tables);
      const toId = resolveTableKey(join.rightTable, tables);
      if (!fromId || !toId) return null;
      const from = nodeMap.get(fromId);
      const to = nodeMap.get(toId);
      if (!from || !to) return null;

      const fromX = from.x + from.width;
      const fromY = from.y + from.height / 2;
      const toX = to.x;
      const toY = to.y + to.height / 2;

      return {
        joinIndex,
        join,
        fromId,
        toId,
        fromX,
        fromY,
        toX,
        toY,
        labelX: (fromX + toX) / 2,
        labelY: (fromY + toY) / 2,
      };
    })
    .filter(Boolean) as GraphEdge[];

  const width = PADDING + (maxLayer + 1) * (NODE_W + LAYER_GAP_X) + PADDING;
  const height =
    Math.max(...nodes.map((n) => n.y + n.height), 120) + PADDING * 2;

  return { nodes, edges, width, height };
};

export const isNodeInJoin = (
  nodeId: string,
  joinIndex: number,
  joins: JoinRef[],
  tables: TableRef[]
) => {
  const join = joins[joinIndex];
  if (!join) return false;
  return (
    resolveTableKey(join.leftTable, tables) === nodeId ||
    resolveTableKey(join.rightTable, tables) === nodeId
  );
};
