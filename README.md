# SQLens

**Live demo:** [sqlens-xi.vercel.app](https://sqlens-xi.vercel.app)

SQLens is a browser-based SQL query explainer. Paste a query and get an instant breakdown of clauses, tables, joins, execution order, and common performance warnings — no database connection required.

## What it does

- Parses SQL in the browser (MySQL and PostgreSQL dialects)
- Highlights and explains each clause in plain language
- Draws an interactive table relationship diagram with join conditions
- Shows logical execution order with a step-by-step animation
- Lists selected columns grouped by table
- Flags heuristic performance issues (`SELECT *`, missing `WHERE`, implicit joins, etc.)
- Exports results: copy query, formatted copy, shareable URL, diagram PNG

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) for AST parsing
- [shadcn/ui](https://ui.shadcn.com/) components

## Getting started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/ilianidimitrov/sqlens.git
cd sqlens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## How it works

All analysis runs client-side. SQL is parsed into an AST, then transformed into structured data for the UI: clause segments, table references, join graph, column list, execution steps, and warning rules. Nothing is sent to a server.

## Supported dialects

| Dialect    | Support        |
|------------|----------------|
| MySQL      | Primary        |
| PostgreSQL | Supported      |
| SQLite     | Partial        |

## Project structure

```
app/              Next.js pages and layout
components/       UI: query editor, diagrams, panels
lib/              Parser, explainer, warnings, graph layout
messages/         i18n strings (English)
types/            Shared TypeScript types
```

## License

MIT
