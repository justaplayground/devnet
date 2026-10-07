---
name: db-schema-diagram
description: Create polished dark-themed database schema diagrams as self-contained HTML+SVG files. Use when the user asks for ER diagrams, table layouts, Prisma or SQL schema maps, or foreign-key relationships.
---

# Database Schema Diagram Skill

Create professional database schema diagrams as self-contained HTML files with inline SVG graphics and CSS styling. Each table is a card: a colored header, one row per column, and relationship lines labeled with cardinality.

> **Version 1.0** · MIT License · Authored by [Giang, N.T.](mailto:dev.giangnt.work@gmail.com)
> Sibling of the architecture-diagram and process-flow-diagram skills in this repo.

## When to Use

Use for:
- Physical or logical schema maps (tables, columns, types, keys)
- Prisma, SQL, or ORM model relationship diagrams
- Foreign-key and cardinality documentation
- Bounded-context groupings of tables (auth, billing, content)

Skip when: the subject is system or infrastructure topology — use [architecture-diagram](../architecture-diagram/SKILL.md). Skip when the subject is a sequential workflow — use [process-flow-diagram](../process-flow-diagram/SKILL.md).

Read the user's schema. Do not invent tables or columns that are not in the source.

## Design System

### Color Palette (Table Roles)

Color a table by its role. The header bar uses the translucent fill; the card stroke and primary-key labels use the stroke color. The card body stays opaque so relationship lines underneath do not show through.

| Table Role | Header Fill | Stroke | Use for |
|------------|-------------|--------|---------|
| Identity / Core | `rgba(8, 51, 68, 0.45)` | `#22d3ee` (cyan-400) | `users`, accounts, tenants |
| Domain / Content | `rgba(6, 78, 59, 0.45)` | `#34d399` (emerald-400) | Business entities (`posts`, orders) |
| Lookup / Reference | `rgba(76, 29, 149, 0.45)` | `#a78bfa` (violet-400) | Enums, status, reference data |
| Junction | `rgba(120, 53, 15, 0.45)` | `#fbbf24` (amber-400) | Many-to-many link tables |
| Auth / Security | `rgba(136, 19, 55, 0.45)` | `#fb7185` (rose-400) | Sessions, credentials, policies |
| Audit / System | `rgba(30, 41, 59, 0.5)` | `#94a3b8` (slate-400) | Logs, outbox, schema metadata |

Relationship lines are amber (`#fbbf24`, stroke-width `2`) because they mark foreign keys. Optional relationships (nullable FK) use the same color with `stroke-dasharray="6,4"`.

### Column Markers

| Marker | Color | Meaning |
|--------|-------|---------|
| `🔑` | Table stroke color | Primary key |
| `🔗` | `#fbbf24` | Foreign key |
| Column name | `#ffffff` | Regular column |
| Datatype | `#94a3b8` | Right side of the row |
| `UQ` | `#a78bfa` | Unique constraint, appended after the name |
| `?` on the datatype | `#94a3b8` | Nullable (`varchar?`) |

Composite primary keys: mark each participating column with `🔑`. Many-to-many is a junction table with two `🔗` columns, not a line drawn straight between the two parents.

If a renderer drops the emoji, fall back to the text prefixes `PK` and `FK` in the same colors. Keep markers inside `<text>`, never inside `<foreignObject>`.

### Typography

Use JetBrains Mono for all text:

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Font sizes: 13px for table names, 11px for column names and datatypes, 10px for cardinality labels, 12px for the legend title, 11px for legend items.

### Visual Elements

**Background:** `#020617` (slate-950) with a 40px grid:

```svg
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
</pattern>
```

**Table card:** Opaque body `fill="#0f172a"`, `rx="8"`, stroke-width `1.5`. Header bar is a second rect, same width, height `36`, same stroke, role fill. Draw the header after the body so it covers the body's top edge.

**Column separators:** `stroke="#1e293b"`, from local `x=10` to `x = width - 10`, 10px below the column baseline.

**Context boundaries:** Dashed amber container around a group of related tables (`stroke-dasharray="8,4"`, `rx="12"`, no fill). Place the context name just above the boundary, `font-size="10"`, fill `#fbbf24`.

**Arrowhead:** One marker. `fill="context-stroke"` keeps the head the same color as the line.

```svg
<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke"/>
</marker>
```

**Arrow z-order:** Draw relationship paths after the grid and before table groups when a path might pass under a card. Table bodies are opaque `#0f172a`, so they mask anything underneath. Paths that stay in the gaps between cards may be drawn after the tables.

**Cardinality label:** `font-size="10"`, `text-anchor="middle"`, fill matching the line, placed 10px above the segment it describes. House style is a text label (`1 → 1`, `1 → N`), not crow's foot notation.

### Table Geometry

A table is one `<g transform="translate(X,Y)">`. All column coordinates below are local.

| Piece | Value |
|-------|-------|
| Default width | 280px. Widen to 320 or 360 when a column name plus datatype will collide. |
| Header | `y=0`, height `36`, title at `(18, 23)`, left aligned, `font-weight="700"` |
| First column baseline | `y=60` |
| Row pitch | 32px. Column `i` (0-based) baseline = `60 + i * 32` |
| Separator | `y = baseline + 10` |
| Name | `x=14` |
| Datatype | `x = width - 100` (180 when width is 280, 200 when width is 300) |
| Card height | `60 + (n - 1) * 32 + 28` |

Do not reuse a fixed height from the sample. A 4-column table is 184px tall; a 8-column table is 312px tall. Empty space under the last column means the height is too large. A clipped last separator means it is too small.

**Width check:** at 11px JetBrains Mono, budget ~6.6px per character. Required width ≈ `14 + nameChars * 6.6 + 24 + typeChars * 6.6 + 16`. Round up to 280, 320, or 360. If the datatype still collides with the name, drop the datatype to a second line at `baseline + 14` in 9px and add 14px to that row's pitch — only for that column.

### Spacing Rules

- **Horizontal gap** between cards: 140px minimum, so a `1 → N` label fits. The sample uses 180px (`users` ends at x=340, `posts` starts at x=520).
- **Vertical gap** between stacked cards: 48px minimum.
- **Context boundary padding:** 24px inside the dashed box, past every card edge. The context title sits 16px above the boundary.
- **Arrow endpoints** touch the card edge. Do not stop short and do not enter the fill. Parent (the "1" side) is on the left; the arrowhead lands on the FK table. Attach the line to the FK row, not the vertical center of the card, when the row is obvious.

**Vertical stack example:**

```
users:  y=80,  height=184 → ends at y=264
gap:    y=264 to y=312   → 48px
posts:  y=312, height=184 → ends at y=496
```

**Relationship attach point** for column `i` on a card at `(X, Y)`:

- Global row center ≈ `Y + 60 + i * 32 - 2` (2px above the column baseline; this is the sample's `y=170` for `posts.user_id`)
- Exit on the right: `(X + width, rowCenter)`
- Enter on the left: `(X, rowCenter)`

The sample line `y=170` into `posts` (`translate(520,80)`, `user_id` at local baseline 92) is the optical center of that FK row.

Orthogonal routing when the cards are not on the same row:

```svg
<path d="M x1 y1 L midX y1 L midX y2 L x2 y2"
      fill="none" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowhead)"/>
```

Keep elbows in the gaps. Never route a line across a column list.

**Self-reference** (for example `users.manager_id → users.id`): leave the right edge, travel down through the 48px gap (or 36px below the card if it is the lowest in its column), and re-enter the left edge at the FK row. Use a dashed amber stroke when the FK is nullable.

### Legend Placement

Place the legend outside every table card and outside every context boundary.

- Prefer the top-right of the canvas when that column is empty (the sample uses `translate(1180,70)`).
- When the right side is filled, place the legend at least 20px below the lowest boundary and extend the viewBox height to fit it.
- Legend contents, in order: `🔑 Primary Key`, `🔗 Foreign Key`, datatype, then one swatch per table role actually used.

### ViewBox & Overflow

**CRITICAL: the right edge clips when these three numbers drift apart.**

1. Let `V` be the viewBox width and `H` the viewBox height.
2. `.diagram svg { min-width: Vpx; }` — the SVG must not shrink below its design width.
3. `.container { max-width: (V + 48)px; }` — the extra 48px covers the diagram frame's 24px side padding. Setting max-width equal to `V` causes a horizontal scroll and clips the right side on PNG/PDF export.

The sample file uses `viewBox="0 0 1600 900"` with `min-width: 1400px` and `max-width: 1600px`. When you customize it, replace that mismatch: if the viewBox stays `1600 × 900`, set `min-width: 1600px` and `.container { max-width: 1648px }`.

**Sizing formula:**

- Left padding 60px, right padding 40px, top padding 80px, bottom padding 40px.
- Width ≈ `60 + (columns of tables) × (tableWidth + 140) - 140 + 40`. Add 220px if the legend sits in a right-hand column.
- Height ≈ `80 + tallest column of stacked tables + 40`. Add 80px if the legend moves below the tables.
- Default safe canvas for the two-table sample: `viewBox="0 0 1600 900"`.
- If a horizontal layout would pass 1800px, wrap tables onto a second row and route the relationship with an orthogonal path in the vertical gap. Do not keep stretching one row.

### Layout Structure

1. **Header** — title with pulsing cyan dot, subtitle (engine, schema name, or source file), export toolbar
2. **Main SVG** — grid, context boundaries, relationship paths, table cards, legend
3. **Summary cards** — three cards under the diagram
4. **Footer** — one metadata line (source, date, table count)

The sample template stops at the SVG and a one-line footer. Add the summary cards when you produce a real diagram. Copy this CSS from the architecture-diagram template:

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 2rem; }
.card { background: rgba(15, 23, 42, 0.5); border-radius: 0.75rem; border: 1px solid #1e293b; padding: 1.25rem; }
.card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.card-dot { width: 8px; height: 8px; border-radius: 50%; }
.card-dot.cyan { background: #22d3ee; }
.card-dot.emerald { background: #34d399; }
.card-dot.violet { background: #a78bfa; }
.card-dot.amber { background: #fbbf24; }
.card-dot.rose { background: #fb7185; }
.card h3 { font-size: 0.875rem; font-weight: 600; }
.card ul { list-style: none; color: #94a3b8; font-size: 0.75rem; }
.card li { margin-bottom: 0.375rem; }
```

The three cards are:

1. **Tables** — groups and how many tables are in each
2. **Relationships** — each FK as `child.column → parent.column (1 → N)`
3. **Constraints** — unique keys, composite keys, nullable FKs, indexes worth calling out

### Export Toolbar (built-in)

Every diagram ships with a single unobtrusive `⋯` toggle in the header. Click it to reveal three buttons — 📋 Copy (high-DPI PNG to clipboard, scale: 2), 🖼️ PNG (high-DPI PNG download), 📄 PDF (PNG embedded in a one-page PDF via jsPDF). The toolbar collapses back to the icon by default so it doesn't clutter the diagram. All three formats use the same html2canvas capture (with the toolbar excluded and 32px padding around the content), so PDF preserves the dark theme without going through the browser's print dialog.

When generating a new diagram, keep these intact in the template:

- The two CDN scripts in `<head>` (pinned versions, with Subresource Integrity hashes and `crossorigin="anonymous"`):
  - `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js` — `integrity="sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H"`
  - `https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js` — `integrity="sha384-en/ztfPSRkGfME4KIm05joYXynqzUgbsG5nMrj/xEFAHXkeZfO3yMK8QQ+mP7p1/"`
  - SRI ensures generated diagrams are tamper-resistant against CDN compromise. Do not modify the hashes; if the version is bumped, the new hash must be computed fresh.
- `id="report-container"` on the outermost `.container` div (this is what gets captured)
- `.toolbar` markup with `.toolbar-actions` (collapsed by default) and `.toolbar-toggle` (the `⋯` button)
- `.toolbar` CSS + `@media print { .toolbar { display: none !important; } }`
- `copyAsImage()`, `downloadPNG()`, and `downloadPDF()` script before `</body>`, all using `getBoundingClientRect()` + `html2canvas(document.body, { x, y, width, height, ignoreElements })` to capture a precise rect with breathing room and no toolbar

Caveats: clipboard API needs a user gesture and a secure context (https/file/localhost). SVG `<foreignObject>` renders inconsistently in html2canvas — stick to plain `<svg>` shapes and `<text>`. Bump `scale: 2` to `3` or `4` for higher-res output. Rename the download filenames from `db-schema.png` / `db-schema.pdf` to the project name.

### Table Card Pattern

```svg
<g id="users" transform="translate(X,Y)">
  <rect width="280" height="HEIGHT" rx="8" fill="#0f172a" stroke="#22d3ee" stroke-width="1.5"/>
  <rect width="280" height="36" rx="8" fill="rgba(8,51,68,0.45)" stroke="#22d3ee" stroke-width="1.5"/>
  <text x="18" y="23" fill="white" font-size="13" font-weight="700">users</text>

  <text x="14" y="60" fill="#22d3ee" font-size="11">🔑 id</text>
  <text x="180" y="60" fill="#94a3b8" font-size="11">uuid</text>
  <line x1="10" x2="270" y1="70" y2="70" stroke="#1e293b"/>

  <text x="14" y="92" fill="white" font-size="11">email UQ</text>
  <text x="180" y="92" fill="#94a3b8" font-size="11">varchar</text>
  <line x1="10" x2="270" y1="102" y2="102" stroke="#1e293b"/>
</g>
```

`UQ` on `email` is violet (`#a78bfa`) when you split it into its own `<text>` after the name. A single white `<text>` is acceptable when the row is crowded.

### Relationship Pattern

```svg
<line x1="PARENT_RIGHT" y1="FK_ROW" x2="CHILD_LEFT" y2="FK_ROW"
      stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowhead)"/>
<text x="MID_X" y="FK_ROW-10" fill="#fbbf24" font-size="10" text-anchor="middle">1 → N</text>
```

Nullable FK: add `stroke-dasharray="6,4"` and label `0..1 → N`.

Junction (N to N): parent A on the left, junction in the middle (amber stroke), parent B on the right. Two arrows, both pointing into the junction: `posts 1 → N post_tags` and `tags 1 → N post_tags`.

### Info Card Pattern

```html
<div class="card">
  <div class="card-header">
    <div class="card-dot amber"></div>
    <h3>Relationships</h3>
  </div>
  <ul>
    <li>• posts.user_id → users.id (1 → N)</li>
    <li>• post_tags.post_id → posts.id (1 → N)</li>
  </ul>
</div>
```

## Template

Copy and customize `resources/template.html`. Key customization points:

1. Update the `<title>`, header, and subtitle
2. Set viewBox, `svg` min-width, and `.container` max-width together (`max-width = viewBox width + 48`)
3. Replace the sample `users` and `posts` groups with the real tables. Recompute each card height from its column count
4. Draw one relationship path per foreign key, labeled with cardinality
5. Move the legend so it does not overlap any card or context boundary
6. Add the three summary cards and the card CSS
7. Update the footer, and the PNG/PDF download filenames

## Output

Always produce a single self-contained `.html` file with:

- Embedded CSS (no external stylesheets except Google Fonts)
- Inline SVG (no external images)
- Two CDN scripts for the export toolbar (html2canvas, jsPDF) — both pinned with SRI hashes

The file should render correctly when opened directly in any modern browser.

## Quality Assurance — Preview & Fix

**IMPORTANT: Always preview the diagram before delivering to the user.**

After creating the HTML file, follow this QA process based on your context:

### Context-Aware QA Approaches

| Context | QA Approach |
|---------|-------------|
| **Claude in Chrome** | Take screenshot with browser tools, visually inspect, fix issues, re-screenshot to verify |
| **Claude.ai with artifacts** | Present file to user — they see rendered preview and can report issues for you to fix |
| **Claude Code CLI** | Inform user to open the HTML file in browser and report any visual issues |
| **API/Agents SDK** | If Puppeteer/Playwright available, screenshot programmatically; otherwise inform user to verify |

### Step 1: Preview the diagram

1. Copy the file to `/mnt/user-data/outputs/` (in Claude.ai sandbox)
2. Use `present_files` to share it with the user
3. **If browser tools available:** Take a screenshot to visually inspect
4. **If no browser tools:** Let the user know you followed the design system but they should verify the rendering

### Step 2: Check for common issues

Inspect the screenshot (or ask the user to check) for these problems:

**Layout issues:**
- [ ] Right-side cutoff (last table, legend, or cardinality label clipped)
- [ ] Table cards overlapping each other or a context boundary
- [ ] Legend sitting on top of a card or inside a dashed boundary
- [ ] viewBox, `svg` min-width, and container max-width out of agreement

**Table issues:**
- [ ] Last column clipped, or a large empty well under the last column (height not recomputed)
- [ ] Datatype colliding with the column name
- [ ] Header title wider than the card
- [ ] Primary-key color not matching that card's stroke
- [ ] Foreign key drawn as a plain white column, or a relationship line with no `🔗` on the column

**Relationship issues:**
- [ ] Arrow stopping short of the card edge, or continuing into the column text
- [ ] Line drawn across a card instead of through a gap
- [ ] Cardinality label sitting on the stroke (move it to `y - 10`)
- [ ] Arrow attached to the card's vertical middle when the FK row is elsewhere
- [ ] Many-to-many drawn as one line between parents, with no junction table
- [ ] Arrowhead color different from the line (the marker must use `context-stroke`)

**Text issues:**
- [ ] Labels overlapping each other
- [ ] Text extending outside the card
- [ ] Unreadable font sizes

### Step 3: Fix any issues found

| Problem | Solution |
|---------|----------|
| Right-side cutoff | Increase viewBox width, set `min-width` to the same value, set container max-width to viewBox + 48 |
| Card overlap | Increase the gap to 140px horizontal or 48px vertical, or wrap to another row |
| Datatype collision | Widen the card (280 → 320 → 360) and move the datatype `x` to `width - 100` |
| Clipped last row | Set height to `60 + (n - 1) * 32 + 28` |
| Arrow not on the FK row | Set both endpoints to `Y + 60 + i * 32 - 2` |
| Label on the line | Place the label at `y - 10` with `text-anchor="middle"` |
| Legend overlap | Move it 20px below the lowest boundary, or into an empty right column |
| Line through a card | Redraw as an orthogonal path that stays in the gaps |

### Step 4: Re-preview if changes were made

- **With browser tools:** Take another screenshot to verify
- **Without browser tools:** Re-present the file and let the user confirm the fix

### Coordinate Reference

For a table `<g transform="translate(X,Y)">` with `width=280` and `n` columns:

- **Left / right:** `X` and `X + 280`
- **Top / bottom:** `Y` and `Y + 60 + (n - 1) * 32 + 28`
- **Header title:** local `(18, 23)`
- **Column `i` name:** local `(14, 60 + i * 32)`
- **Column `i` datatype:** local `(180, 60 + i * 32)`
- **Separator `i`:** local `y = 70 + i * 32`, from `x=10` to `x=270`
- **FK attach, global:** `(X, Y + 58 + i * 32)` on the left edge, `(X + 280, Y + 58 + i * 32)` on the right edge

Worked attach for the sample: `users` at `(60, 80)` width 280, `posts` at `(520, 80)`, `user_id` is column index 1. The line runs `(340, 170) → (520, 170)` with the label centered at `(430, 160)`.

## Example Schema Shapes

### One-to-many (sample)

`users` (cyan, identity) on the left, `posts` (emerald, domain) on the right, `posts.user_id → users.id`, label `1 → N`. This is the sample already in `resources/template.html`.

### Many-to-many

`posts` (emerald) → `post_tags` (amber, junction) ← `tags` (violet, lookup). Both arrows point at the junction. `post_tags` shows two `🔗` columns and a composite primary key.

### Optional self-reference

`users.manager_id` is a nullable FK to `users.id`. Dashed amber path leaves the right edge, drops below the card, and re-enters the left edge at the `manager_id` row. Label `0..1 → N`.

### Bounded contexts

Group tables that belong together inside a dashed amber boundary (`stroke-dasharray="8,4"`, `rx="12"`), with 24px of inner padding. Typical split: Identity, Billing, Content. The legend stays outside all of those boundaries.

## Worked Example — Users and Posts

Starting point for a two-table diagram. Replace names and columns from the real schema; keep the geometry.

**Canvas:** `viewBox="0 0 1600 900"`, `svg { min-width: 1600px }`, `.container { max-width: 1648px }`.

| Element | x | y | w × h | Notes |
|---------|---|---|-------|-------|
| `users` | 60 | 80 | 280 × 184 | 4 columns, cyan. Right edge 340 |
| `posts` | 520 | 80 | 300 × 184 | 4 columns, emerald. Left edge 520 |
| Relationship | 340 → 520 | 170 | — | `posts.user_id` is column index 1 |
| Label `1 → N` | 430 | 160 | — | 10px above the line |
| Legend | 1180 | 70 | — | Empty right column; not inside a boundary |

Local rows on `posts`: `id` baseline 60 (PK, emerald), `user_id` baseline 92 (FK, amber), `title` baseline 124, `content` baseline 156. Separator `x` runs `10 → 290` because this card is 300px wide, and the datatype column sits at `x=200` (`width - 100`).
