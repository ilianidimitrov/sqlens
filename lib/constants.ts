import type { ClauseType } from '@/types/sql';

export const CLAUSE_COLORS: Record<ClauseType, string> = {
  SELECT: '#FF7B72',
  FROM: '#79C0FF',
  JOIN: '#D2A8FF',
  WHERE: '#FFA657',
  GROUP_BY: '#56D364',
  HAVING: '#56D364',
  ORDER_BY: '#F78166',
  LIMIT: '#8B949E',
  OFFSET: '#8B949E',
  SUBQUERY: '#FFD700',
  WITH: '#D2A8FF',
};

export const TABLE_COLOR_PALETTE = [
  '#00D4AA',
  '#58A6FF',
  '#D2A8FF',
  '#FFA657',
  '#56D364',
  '#FF7B72',
  '#79C0FF',
  '#F78166',
];

export const EXAMPLE_QUERIES: { label: string; sql: string }[] = [
  {
    label: 'Simple SELECT',
    sql: `SELECT id, name, email FROM users WHERE active = 1 ORDER BY name ASC LIMIT 10;`,
  },
  {
    label: 'JOIN with aggregation',
    sql: `SELECT u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC;`,
  },
  {
    label: 'Subquery',
    sql: `SELECT p.name, p.price
FROM products p
WHERE p.category_id IN (
  SELECT id FROM categories WHERE active = 1
)
AND p.price < (
  SELECT AVG(price) FROM products
);`,
  },
  {
    label: 'Multiple JOINs',
    sql: `SELECT o.id, u.name, u.email, p.name as product, oi.quantity, oi.price
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed'
AND o.created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY o.created_at DESC;`,
  },
  {
    label: 'WITH (CTE)',
    sql: `WITH monthly_revenue AS (
  SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
         SUM(total) as revenue
  FROM orders
  WHERE status = 'paid'
  GROUP BY month
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) as prev_revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) as growth
FROM monthly_revenue
ORDER BY month DESC;`,
  },
  {
    label: 'SELECT *  (bad practice)',
    sql: `SELECT * FROM users u, orders o WHERE u.id = o.user_id;`,
  },
];

export const SQL_EXECUTION_ORDER: ClauseType[] = [
  'WITH',
  'FROM',
  'JOIN',
  'WHERE',
  'GROUP_BY',
  'HAVING',
  'SELECT',
  'ORDER_BY',
  'LIMIT',
  'OFFSET',
];

export const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL OUTER JOIN',
  'CROSS JOIN',
  'NATURAL JOIN',
  'ON',
  'AND',
  'OR',
  'NOT',
  'IN',
  'EXISTS',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'AS',
  'GROUP BY',
  'HAVING',
  'ORDER BY',
  'ASC',
  'DESC',
  'LIMIT',
  'OFFSET',
  'WITH',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'DROP',
  'TABLE',
  'INDEX',
  'DISTINCT',
  'UNION',
  'ALL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'OVER',
  'PARTITION BY',
];
