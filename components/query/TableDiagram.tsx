'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Maximize2, Minimize2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TableRef, JoinRef, ColumnRef } from '@/types/sql';
import {
  buildGraphLayout,
  isNodeInJoin,
  tableId,
  NODE_W,
} from '@/lib/graphLayout';
import { cn } from '@/lib/utils';

interface TableDiagramProps {
  tables: TableRef[];
  joins: JoinRef[];
  columns: ColumnRef[];
  isValid: boolean;
  onTableHover: (table: string | null) => void;
}

const JOIN_COLORS: Record<string, string> = {
  'INNER JOIN': '#00D4AA',
  'LEFT JOIN': '#58A6FF',
  'RIGHT JOIN': '#D2A8FF',
  'FULL OUTER JOIN': '#FFA657',
  'CROSS JOIN': '#FF7B72',
  'NATURAL JOIN': '#56D364',
};

const clean = (s: string) => s.replace(/`/g, '').replace(/\s+/g, ' ').trim();

function GraphView({
  tables,
  joins,
  layout,
  hoveredNode,
  hoveredJoin,
  onNodeHover,
  onJoinHover,
}: {
  tables: TableRef[];
  joins: JoinRef[];
  layout: ReturnType<typeof buildGraphLayout>;
  hoveredNode: string | null;
  hoveredJoin: number | null;
  onNodeHover: (id: string | null) => void;
  onJoinHover: (i: number | null) => void;
}) {
  const nodeActive = (id: string) =>
    hoveredNode === id ||
    (hoveredJoin !== null && isNodeInJoin(id, hoveredJoin, joins, tables));

  const joinActive = (i: number) =>
    hoveredJoin === i ||
    (hoveredNode !== null && isNodeInJoin(hoveredNode, i, joins, tables));

  return (
    <div
      className="relative mx-auto"
      style={{ width: layout.width, height: layout.height, minHeight: 200 }}
    >
      <svg
        className="pointer-events-none absolute inset-0"
        width={layout.width}
        height={layout.height}
      >
        <defs>
          {layout.edges.map((edge) => {
            const color = JOIN_COLORS[edge.join.type] ?? '#00D4AA';
            return (
              <marker
                key={`m-${edge.joinIndex}`}
                id={`arr-${edge.joinIndex}`}
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 7 3.5, 0 7" fill={color} />
              </marker>
            );
          })}
        </defs>
        {layout.edges.map((edge) => {
          const color = JOIN_COLORS[edge.join.type] ?? '#00D4AA';
          const active = joinActive(edge.joinIndex);
          const { labelX, fromX, fromY, toX, toY } = edge;
          const gap = 52;

          let d: string;
          if (Math.abs(fromY - toY) < 4) {
            d = `M ${fromX} ${fromY} L ${labelX - gap} ${fromY} M ${labelX + gap} ${toY} L ${toX} ${toY}`;
          } else {
            d = `M ${fromX} ${fromY} L ${labelX - gap} ${fromY} L ${labelX - gap} ${toY} L ${labelX + gap} ${toY} L ${toX} ${toY}`;
          }

          return (
            <path
              key={edge.joinIndex}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={active ? 2.5 : 1.5}
              strokeOpacity={active ? 1 : 0.5}
              markerEnd={`url(#arr-${edge.joinIndex})`}
            />
          );
        })}
      </svg>

      {layout.edges.map((edge) => {
        const color = JOIN_COLORS[edge.join.type] ?? '#00D4AA';
        const active = joinActive(edge.joinIndex);
        const condition = clean(edge.join.condition);
        return (
          <div
            key={`lbl-${edge.joinIndex}`}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-lg border-2 px-3 py-2 shadow-lg"
            style={{
              left: edge.labelX,
              top: edge.labelY,
              minWidth: 160,
              maxWidth: 280,
              borderColor: color,
              backgroundColor: '#161B22',
              boxShadow: active ? `0 0 16px ${color}50` : '0 4px 12px #00000050',
            }}
            onMouseEnter={() => onJoinHover(edge.joinIndex)}
            onMouseLeave={() => onJoinHover(null)}
          >
            <p
              className="text-center font-mono text-[10px] font-bold uppercase tracking-wide"
              style={{ color }}
            >
              {edge.join.type}
            </p>
            {condition && (
              <p className="mt-1 break-words text-center font-mono text-[10px] leading-relaxed text-[#C9D1D9]">
                {condition}
              </p>
            )}
          </div>
        );
      })}

      {layout.nodes.map((node) => {
        const active = nodeActive(node.id);
        const { table } = node;
        const shown = node.columns.slice(0, 6);
        const more = node.columns.length - shown.length;

        return (
          <div
            key={node.id}
            className="absolute z-10 overflow-hidden rounded-xl border-2 transition-shadow"
            style={{
              left: node.x,
              top: node.y,
              width: NODE_W,
              height: node.height,
              borderColor: table.color,
              backgroundColor: '#161B22',
              boxShadow: active
                ? `0 0 20px ${table.color}45, 0 6px 20px #00000050`
                : '0 4px 14px #00000035',
            }}
            onMouseEnter={() => onNodeHover(node.id)}
            onMouseLeave={() => onNodeHover(null)}
          >
            <div
              className="border-b border-[#30363D] px-3 py-2"
              style={{ backgroundColor: `${table.color}12` }}
            >
              <p className="font-mono text-[13px] font-bold leading-tight" style={{ color: table.color }}>
                {table.name}
              </p>
              {table.alias && (
                <p className="font-mono text-[10px] text-[#8B949E]">{table.alias}</p>
              )}
            </div>
            {node.columns.length > 0 && (
              <ul className="px-2 py-1.5">
                {shown.map((col, i) => {
                  const isKey = node.joinKeys.includes(col.column);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-1 py-px font-mono text-[10px]"
                    >
                      {isKey && <KeyRound className="h-2.5 w-2.5 shrink-0 text-[#FFD700]" />}
                      <span className={cn(isKey ? 'text-[#FFD700]' : 'text-[#A5F3FC]')}>
                        {col.column}
                      </span>
                    </li>
                  );
                })}
                {more > 0 && (
                  <li className="font-mono text-[9px] text-[#8B949E]">+{more}</li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TableDiagram({
  tables,
  joins,
  columns,
  isValid,
  onTableHover,
}: TableDiagramProps) {
  const t = useTranslations('diagram');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredJoin, setHoveredJoin] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!fullscreen) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
    };
  }, [fullscreen]);

  const layout = useMemo(
    () => buildGraphLayout(tables, joins, columns),
    [tables, joins, columns]
  );

  const setNode = (id: string | null) => {
    setHoveredNode(id);
    if (id) {
      const tbl = tables.find((t) => tableId(t) === id);
      onTableHover(tbl?.name ?? null);
    } else onTableHover(null);
  };

  if (!isValid || tables.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[#8B949E]">
        {t('empty')}
      </div>
    );
  }

  const legend = (
    <div className="flex flex-wrap gap-2">
      {Object.entries(JOIN_COLORS).slice(0, 4).map(([type, color]) => (
        <span
          key={type}
          className="inline-flex items-center gap-1.5 rounded border border-[#30363D] px-2 py-0.5 font-mono text-[10px]"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[#8B949E]">{type}</span>
        </span>
      ))}
    </div>
  );

  const graph = (
    <GraphView
      tables={tables}
      joins={joins}
      layout={layout}
      hoveredNode={hoveredNode}
      hoveredJoin={hoveredJoin}
      onNodeHover={setNode}
      onJoinHover={setHoveredJoin}
    />
  );

  const overlay =
    mounted && fullscreen
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex flex-col bg-[#0D1117]">
            <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-3">
              <div>
                <p className="font-mono text-sm font-semibold text-[#E6EDF3]">{t('title')}</p>
                <p className="font-mono text-xs text-[#8B949E]">
                  {tables.length} tables · {joins.length} joins
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#30363D]"
                onClick={() => setFullscreen(false)}
              >
                <Minimize2 className="h-3.5 w-3.5" />
                {t('exitFullscreen')}
              </Button>
            </div>
            <div className="flex flex-1 items-start justify-center overflow-auto p-8">
              {graph}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div id="sqlens-diagram" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {legend}
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-[#30363D] px-2 text-xs"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-3 w-3" />
          {t('fullscreen')}
        </Button>
      </div>

      <p className="font-mono text-[10px] text-[#8B949E]">
        {tables.length} tables · {joins.length} joins · left → right flow
      </p>

      <div className="flex justify-center overflow-x-auto rounded-xl border border-[#30363D] bg-[#080c10] p-6">
        {graph}
      </div>

      {overlay}
    </div>
  );
}
