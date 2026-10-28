import { BoardRow, SectorInfo } from '../types/market';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectZero(): Rect {
  return { x: 0, y: 0, w: 0, h: 0 };
}

function worst(row: number[], sum: number, side: number): number {
  const maxA = Math.max(...row);
  const minA = Math.min(...row);
  return Math.max(
    (side * side * maxA) / (sum * sum),
    (sum * sum) / (side * side * minA)
  );
}

export function squarify(weights: number[], rect: Rect): Rect[] {
  const out: Rect[] = Array.from({ length: weights.length }, () => rectZero());
  const idx: number[] = [];
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > 0) {
      idx.push(i);
      total += weights[i];
    }
  }

  if (idx.length === 0 || rect.w <= 0 || rect.h <= 0) return out;
  const scale = (rect.w * rect.h) / total;

  let free: Rect = { ...rect };
  let start = 0;

  while (start < idx.length) {
    const shortSide = Math.min(free.w, free.h);
    let end = start + 1;
    let sum = weights[idx[start]] * scale;
    let best = worst([weights[idx[start]] * scale], sum, shortSide);

    while (end < idx.length) {
      const a = weights[idx[end]] * scale;
      const row = idx.slice(start, end + 1).map((k) => weights[k] * scale);
      const w = worst(row, sum + a, shortSide);
      if (w > best) break;
      best = w;
      sum += a;
      end++;
    }

    const horizontal = free.w >= free.h;
    const thickness = sum / shortSide;
    let offset = 0;

    for (let k = start; k < end; k++) {
      const len = (weights[idx[k]] * scale) / thickness;
      if (horizontal) {
        out[idx[k]] = { x: free.x, y: free.y + offset, w: thickness, h: len };
      } else {
        out[idx[k]] = { x: free.x + offset, y: free.y, w: len, h: thickness };
      }
      offset += len;
    }

    if (horizontal) {
      free = { x: free.x + thickness, y: free.y, w: free.w - thickness, h: free.h };
    } else {
      free = { x: free.x, y: free.y + thickness, w: free.w, h: free.h - thickness };
    }
    start = end;
  }

  return out;
}

export interface TreeItem {
  id: string;
  weight: number;
}

export interface TreeGroup {
  name: string;
  items: TreeItem[];
  weight: number;
}

export interface PlacedItem {
  id: string;
  rect: Rect;
}

export interface PlacedGroup {
  name: string;
  rect: Rect;
  header: Rect;
  items: PlacedItem[];
}

export function layoutTwoLevel(
  groups: TreeGroup[],
  bounds: Rect,
  headerH = 16,
  gap = 1.5
): PlacedGroup[] {
  const live = groups.filter((g) => g.weight > 0);
  const rects = squarify(live.map((g) => g.weight), bounds);

  return live.map((g, i) => {
    const r = rects[i];
    const showHeader = r.h >= headerH * 2.2 && r.w >= 40;
    const header: Rect = showHeader
      ? { x: r.x, y: r.y, w: r.w, h: headerH }
      : { x: r.x, y: r.y, w: r.w, h: 0 };

    const inner: Rect = {
      x: r.x + gap / 2,
      y: r.y + header.h + gap / 2,
      w: Math.max(0, r.w - gap),
      h: Math.max(0, r.h - header.h - gap),
    };

    const cells =
      inner.w > 0 && inner.h > 0
        ? squarify(g.items.map((it) => it.weight), inner)
        : Array.from({ length: g.items.length }, () => rectZero());

    const placedItems: PlacedItem[] = [];
    g.items.forEach((it, k) => {
      const cell = cells[k];
      if (cell.w > 0 && cell.h > 0) {
        placedItems.push({ id: it.id, rect: cell });
      }
    });

    return {
      name: g.name,
      rect: r,
      header,
      items: placedItems,
    };
  });
}

export interface SectorGroup {
  name: string;
  rows: BoardRow[];
  weight: number;
}

export function groupBySector(
  rows: BoardRow[],
  sectors: Record<string, SectorInfo>
): SectorGroup[] {
  const byValue = (r: BoardRow) => r.valueMn + r.ptValueMn;
  let weightFn = byValue;
  if (rows.every((r) => byValue(r) <= 0)) {
    weightFn = (r: BoardRow) => sectors[r.symbol]?.marketCap ?? 0;
  }

  const map: Record<string, BoardRow[]> = {};
  for (const r of rows) {
    if (weightFn(r) <= 0) continue;
    const sectorName = sectors[r.symbol]?.name || 'Khác';
    if (!map[sectorName]) map[sectorName] = [];
    map[sectorName].push(r);
  }

  const groups: SectorGroup[] = Object.entries(map).map(([name, groupRows]) => {
    groupRows.sort((a, b) => weightFn(b) - weightFn(a));
    const totalWeight = groupRows.reduce((s, r) => s + weightFn(r), 0);
    return { name, rows: groupRows, weight: totalWeight };
  });

  groups.sort((a, b) => b.weight - a.weight);
  return groups;
}
