import type { CoreGrade, Grade, Input, Level, Offer } from './data';

export interface ParsedState {
  input: Input;
  offer: Offer;
  /** Teacher grade boundaries per slot (slot 6 = standalone calculator): min % for grades 2–7. */
  bounds: Record<number, number[]>;
  damaged: boolean;
}

function defaultSubjects(): Input['subjects'] {
  const rows: Input['subjects'] = [];
  for (let i = 0; i < 6; i++) {
    rows.push({ name: '', level: i < 3 ? 'HL' : 'SL', grade: null, locked: false });
  }
  return rows;
}

export function defaultInput(): Input {
  return { subjects: defaultSubjects(), tok: null, ee: null, cas: true };
}

export function defaultOffer(): Offer {
  return { total: null, hl: [], sl: [], subjectMins: [] };
}

function parseCore(v: string): CoreGrade | 'INVALID' {
  if (v === 'A' || v === 'B' || v === 'C' || v === 'D' || v === 'E') return v;
  return 'INVALID';
}

function encodeName(name: string): string {
  // encodeURIComponent leaves '.' unescaped; escape it so '.' can split items.
  return encodeURIComponent(name.slice(0, 40)).replace(/\./g, '%2E');
}

export function encodeState(
  input: Input,
  offer: Offer,
  bounds?: Record<number, (number | null)[]>,
): string {
  const s = input.subjects
    .map((sub) => {
      const lv: string = sub.level === 'HL' ? 'H' : 'S';
      const gr: string = sub.grade === null ? '_' : String(sub.grade);
      return `${lv}${gr}-${encodeName(sub.name)}`;
    })
    .join('.');
  // Build query manually: s is already %-encoded with '.' as separator,
  // so it must not go through URLSearchParams (which would double-encode %).
  const parts: string[] = [];
  parts.push('v=1');
  parts.push(`s=${s}`);
  if (input.tok) parts.push(`tok=${encodeURIComponent(input.tok)}`);
  if (input.ee) parts.push(`ee=${encodeURIComponent(input.ee)}`);
  parts.push(`cas=${input.cas ? '1' : '0'}`);
  if (offer.total !== null) parts.push(`ot=${encodeURIComponent(String(offer.total))}`);
  if (offer.hl.length > 0) parts.push(`oh=${encodeURIComponent(offer.hl.join(''))}`);
  if (offer.sl.length > 0) parts.push(`os=${encodeURIComponent(offer.sl.join(''))}`);
  if (offer.subjectMins.length > 0) {
    const om = offer.subjectMins.map((m) => `${m.index + 1}:${m.min}`).join('.');
    parts.push(`om=${encodeURIComponent(om).replace(/%3A/gi, ':').replace(/%2E/gi, '.')}`);
  }
  const locked = input.subjects
    .map((sub, i) => (sub.locked ? String(i + 1) : null))
    .filter((x): x is string => x !== null);
  if (locked.length > 0) parts.push(`lk=${locked.join('.')}`);
  if (bounds) {
    const gb: string[] = [];
    for (const [k, v] of Object.entries(bounds)) {
      if (/^[0-6]$/.test(k) && Array.isArray(v) && v.length === 6 && v.every((n) => typeof n === 'number')) {
        gb.push(`${k}:${(v as number[]).join(',')}`);
      }
    }
    if (gb.length > 0) parts.push(`gb=${gb.join('.')}`);
  }
  const qs = parts.join('&');
  // Cap whole URL query at 1500 chars (spec 4.5).
  if (qs.length > 1500) return qs.slice(0, 1500);
  return qs;
}

/** Parse a state payload (URL hash content, with or without leading '#', or a
 * legacy query string with or without leading '?'). Never throws. State lives
 * in the hash so grades are never sent to any server. */
export function parseState(search: string): ParsedState {
  let damaged = false;
  const input = defaultInput();
  const offer = defaultOffer();
  const bounds: Record<number, number[]> = {};

  try {
    const noHash = search.startsWith('#') ? search.slice(1) : search;
    let q = noHash.startsWith('?') ? noHash.slice(1) : noHash;
    if (q.length > 1500) {
      damaged = true;
      q = q.slice(0, 1500);
    }
    if (!q) return { input, offer, bounds, damaged };

    const params = new URLSearchParams(q);

    // s
    const sRaw = params.get('s');
    if (sRaw !== null) {
      // URLSearchParams already decodes %XX, which would turn %2E into '.' and
      // break splitting. So re-split carefully: we get raw items by splitting
      // the decoded string on '.' — names containing literal '.' are ambiguous.
      // To handle encoded dots, parse from the raw query instead.
      const rawItems = extractRawParam(q, 's');
      const items = rawItems !== null ? rawItems.split('.') : sRaw.split('.');
      if (items.length !== 6) damaged = true;
      const parsed: Input['subjects'] = [];
      for (let i = 0; i < 6; i++) {
        const fallback = {
          name: '',
          level: (i < 3 ? 'HL' : 'SL') as Level,
          grade: null as Grade | null,
          locked: false,
        };
        const raw = items[i];
        if (raw === undefined || raw === '') {
          parsed.push(fallback);
          if (sRaw !== '') damaged = true;
          continue;
        }
        const m = raw.match(/^([HS])([1-7_])-(.*)$/);
        if (!m) {
          parsed.push(fallback);
          damaged = true;
          continue;
        }
        const level: Level = m[1] === 'H' ? 'HL' : 'SL';
        const grade: Grade | null = m[2] === '_' ? null : (Number(m[2]) as Grade);
        let name = '';
        try {
          name = decodeURIComponent(m[3] as string);
        } catch {
          damaged = true;
          name = '';
        }
        name = name.trim().slice(0, 40);
        // Basic hostile-content guard: names are text only; strip control chars.
        // eslint-disable-next-line no-control-regex
        if (/[\u0000-\u001F\u007F]/.test(name)) {
          // eslint-disable-next-line no-control-regex
          name = name.replace(/[\u0000-\u001F\u007F]/g, '');
          damaged = true;
        }
        parsed.push({ name, level, grade, locked: false });
      }
      input.subjects = parsed;
    }

    // tok / ee
    const tokRaw = params.get('tok');
    if (tokRaw !== null) {
      const v = parseCore(tokRaw);
      if (v === 'INVALID') {
        damaged = true;
      } else {
        input.tok = v;
      }
    }
    const eeRaw = params.get('ee');
    if (eeRaw !== null) {
      const v = parseCore(eeRaw);
      if (v === 'INVALID') {
        damaged = true;
      } else {
        input.ee = v;
      }
    }

    // cas
    const casRaw = params.get('cas');
    if (casRaw !== null) {
      if (casRaw === '1') input.cas = true;
      else if (casRaw === '0') input.cas = false;
      else damaged = true;
    }

    // offer total
    const otRaw = params.get('ot');
    if (otRaw !== null && otRaw !== '') {
      const n = Number(otRaw);
      if (Number.isInteger(n) && n >= 24 && n <= 45) offer.total = n;
      else damaged = true;
    }

    // oh / os
    const ohRaw = params.get('oh');
    if (ohRaw !== null && ohRaw !== '') {
      if (/^[1-7]{1,4}$/.test(ohRaw)) offer.hl = ohRaw.split('').map((c) => Number(c) as Grade);
      else damaged = true;
    }
    const osRaw = params.get('os');
    if (osRaw !== null && osRaw !== '') {
      if (/^[1-7]{1,4}$/.test(osRaw)) offer.sl = osRaw.split('').map((c) => Number(c) as Grade);
      else damaged = true;
    }

    // om
    const omRaw = extractRawParam(q, 'om') ?? params.get('om');
    if (omRaw !== null && omRaw !== '') {
      const pairs = omRaw.split('.');
      if (pairs.length > 3) damaged = true;
      for (const pair of pairs.slice(0, 3)) {
        const m = pair.match(/^([1-6]):([1-7])$/);
        if (!m) {
          damaged = true;
          continue;
        }
        offer.subjectMins.push({ index: Number(m[1]) - 1, min: Number(m[2]) as Grade });
      }
    }

    // lk
    const lkRaw = extractRawParam(q, 'lk') ?? params.get('lk');
    if (lkRaw !== null && lkRaw !== '') {
      const parts = lkRaw.split('.');
      for (const part of parts) {
        if (!/^[1-6]$/.test(part)) {
          damaged = true;
          continue;
        }
        const idx = Number(part) - 1;
        if (input.subjects[idx]) input.subjects[idx]!.locked = true;
      }
    }
    // gb (teacher grade boundaries per slot: min % for grades 2-7)
    const gbRaw = extractRawParam(q, 'gb') ?? params.get('gb');
    if (gbRaw !== null && gbRaw !== '') {
      for (const entry of gbRaw.split('.')) {
        const m = entry.match(/^([0-6]):(\d{1,3}(?:,\d{1,3}){5})$/);
        if (!m) {
          damaged = true;
          continue;
        }
        const nums = m[2]!.split(',').map(Number);
        if (nums.some((n) => n < 0 || n > 100)) {
          damaged = true;
          continue;
        }
        bounds[Number(m[1])] = nums;
      }
    }
  } catch {
    damaged = true;
  }

  return { input, offer, bounds, damaged };
}

/** Get the raw (still %-encoded) value of a query param for dot-safe parsing. */
function extractRawParam(query: string, key: string): string | null {
  const parts = query.split('&');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    if (k === key) return part.slice(eq + 1);
  }
  return null;
}
