import { useEffect, useMemo, useState } from 'preact/hooks';
import { DEFAULT_BOUNDARIES } from './data/boundaries';
import { getSubjectEntry } from './data/components';
import {
  baseFromSlug,
  diplomaLinkFor,
  effectiveBounds,
  encodeSubjectHash,
  findSlotForBase,
  gradeForTotal,
  parseSubjectHash,
  slugifyBase,
  validateSubjectMarks,
  weightedTotal,
} from './data/subjectGrade';
import { isSlOnlySubject, SLOTS, slotSixSubjects } from './rules/data';
import type { Grade, Level } from './rules/data';
import { track } from './analytics';
import './ui/tokens.css';
import './ui/app.css';

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function groupOptions(): { label: string; names: string[] }[] {
  const groups = SLOTS.slice(0, 5).map((s, i) => ({ label: `Group ${i + 1}`, names: [...s.subjects] }));
  const arts = [...SLOTS[5]!.subjects];
  const second = slotSixSubjects().filter((n) => !arts.includes(n));
  groups.push({ label: 'Group 6 — The arts', names: arts });
  groups.push({ label: 'Or a second subject from groups 1–4', names: second });
  return groups;
}

const GROUPS = groupOptions();

function SubjectForm({
  base,
  level,
  bounds,
  onBounds,
}: {
  base: string;
  level: Level;
  bounds: number[] | null;
  onBounds: (b: number[] | null) => void;
}) {
  const entry = getSubjectEntry(base, level);
  const [marks, setMarks] = useState<string[]>(() =>
    Array.from({ length: entry?.components.length ?? 0 }, () => ''),
  );
  const [maxEdits, setMaxEdits] = useState<string[]>(() =>
    Array.from({ length: entry?.components.length ?? 0 }, () => ''),
  );

  const comps = entry?.components ?? [];
  const maxes: (number | null)[] = comps.map((c, i) => {
    const edit = (maxEdits[i] ?? '').trim();
    if (edit !== '') {
      const n = Number(edit);
      return Number.isFinite(n) ? n : null;
    }
    return c.max;
  });
  const parsed: (number | null)[] = marks.map((m) => {
    if (m.trim() === '') return null;
    const n = Number(m);
    return Number.isFinite(n) ? n : null;
  });
  const errors = validateSubjectMarks(parsed, maxes);
  const missing = errors.filter((e) => e.code === 'missing').map((e) => comps[e.index]?.name ?? '');
  const over = errors.find((e) => e.code === 'over');
  const negative = errors.find((e) => e.code === 'negative');
  const total = errors.length === 0 ? weightedTotal(parsed as number[], maxes as number[], comps.map((c) => c.weight)) : null;
  const boundsUsed = effectiveBounds(bounds);
  const customBounds = bounds !== null;
  const grade = total === null ? null : gradeForTotal(total, boundsUsed);
  const anyEditable = comps.some((c) => c.max === null || c.status === 'unverified');

  function setMark(i: number, v: string) {
    setMarks(marks.map((m, j) => (j === i ? v : m)));
  }
  function setMaxEdit(i: number, v: string) {
    setMaxEdits(maxEdits.map((m, j) => (j === i ? v : m)));
  }

  return (
    <div>
      {entry !== null && !entry.components.every((c) => c.status === 'confirmed') && (
        <p class="row-note">Weightings from the current subject guide. Check with your teacher.</p>
      )}
      {anyEditable && (
        <p class="row-note">Check these maximum marks with your teacher.</p>
      )}
      <div class="mark-list">
        {comps.map((c, i) => {
          const err = errors.find((e) => e.index === i);
          const editable = c.max === null || c.status === 'unverified';
          const shownMax = maxes[i];
          return (
            <div key={c.id} class="mark-bigrow">
              <span class="mark-name">{c.name}</span>
              <div class="mark-inputs">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label={`${c.name} mark`}
                  aria-invalid={err !== undefined}
                  class={err !== undefined && err.code !== 'missing' ? 'invalid' : ''}
                  placeholder="Mark"
                  value={marks[i] ?? ''}
                  onInput={(e) => setMark(i, (e.target as HTMLInputElement).value)}
                />
                {editable ? (
                  <label class="max-edit">
                    /{' '}
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      aria-label={`${c.name} maximum marks`}
                      placeholder={c.max === null ? 'Max' : String(c.max)}
                      value={maxEdits[i] ?? ''}
                      onInput={(e) => setMaxEdit(i, (e.target as HTMLInputElement).value)}
                    />
                  </label>
                ) : (
                  <span class="mark-max">/ {shownMax}</span>
                )}
              </div>
              {err?.code === 'over' && (
                <p class="row-note bad">Max is {shownMax}.</p>
              )}
              {err?.code === 'negative' && <p class="row-note bad">Can&apos;t be negative.</p>}
            </div>
          );
        })}
      </div>
      <div aria-live="polite">
        {total === null ? (
          <p class="row-note">
            Add all your marks to see your grade
            {missing.length > 0 ? `: ${missing.join(', ')}` : '.'}
          </p>
        ) : (
          <div class="subject-result">
            <div class="subject-grade num">{grade}</div>
            <p>
              <strong>Predicted grade: {grade}</strong>
              <br />
              <span class="help">
                {base} {level}
              </span>
            </p>
            <p class="help">Estimate. Real grade boundaries change every exam session.</p>
          </div>
        )}
      </div>
      {over === undefined && negative === undefined && <span />}
      <details class="bounds-details">
        <summary>Have your teacher&apos;s grade boundaries?</summary>
        <p class="help">Minimum weighted total (out of 100) for each grade. Saved in the link.</p>
        <div class="bounds-row">
          {[2, 3, 4, 5, 6, 7].map((g, bi) => (
            <label key={g}>
              {g}
              <input
                type="number"
                min={0}
                max={100}
                aria-label={`Minimum total for grade ${g}`}
                placeholder={String(DEFAULT_BOUNDARIES[bi])}
                value={bounds?.[bi] ?? ''}
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value;
                  const next = [0, 1, 2, 3, 4, 5].map((j) => bounds?.[j] ?? null);
                  next[bi] = v === '' ? null : Number(v);
                  onBounds(next.every((n) => typeof n === 'number') ? (next as number[]) : null);
                }}
              />
            </label>
          ))}
        </div>
        {customBounds && (
          <button
            type="button"
            class="linklike"
            onClick={() => onBounds(null)}
          >
            Back to the default estimate
          </button>
        )}
      </details>
      {grade !== null && (
        <p>
          <a
            class="btn btn-primary"
            href={diplomaLinkFor(findSlotForBase(base), grade as Grade, base, level)}
          >
            Use in diploma calculator ›
          </a>
        </p>
      )}
    </div>
  );
}

export function SubjectApp() {
  const [base, setBase] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('HL');
  const [bounds, setBounds] = useState<number[] | null>(null);

  useEffect(() => {
    const parsed = parseSubjectHash(window.location.hash);
    if (parsed.base !== null) setBase(parsed.base);
    setLevel(parsed.level);
    if (parsed.bounds !== null) setBounds(parsed.bounds);
    (SubjectApp as { _marks?: (number | null)[] })._marks = parsed.marks;
    track('example_loaded');
  }, []);

  const initialMarks = (SubjectApp as { _marks?: (number | null)[] })._marks;

  useEffect(() => {
    const t = window.setTimeout(() => {
      const marks: (number | null)[] = [];
      window.history.replaceState(
        null,
        '',
        `#${encodeSubjectHash({ base, level, marks, bounds })}`,
      );
    }, 300);
    return () => window.clearTimeout(t);
  }, [base, level, bounds]);

  const slOnly = base !== null && isSlOnlySubject(base);
  const shownLevel = slOnly ? 'SL' : level;
  const entry = base === null ? null : getSubjectEntry(base, shownLevel);

  return (
    <div class="page">
      <header class="header">
        <a class="wordmark" href="index.html" aria-label="Sevens home">
          <span class="mark" aria-hidden="true">
            7
          </span>
          Sevens
        </a>
        <nav aria-label="Page sections">
          <a class="header-link" href="index.html">
            Diploma score
          </a>
          <a class="header-link" href="subject.html" aria-current="page">
            Subject grade
          </a>
        </nav>
      </header>
      <main class="main subject-main">
        <div class="hero">
          <h1>Subject grade calculator</h1>
          <p>Enter your component marks to estimate your 1–7 grade for one subject.</p>
        </div>
        <section class="section" aria-labelledby="pick-h">
          <h2 id="pick-h">Pick a subject</h2>
          <div class="card pick-card">
            <label class="slot-label" htmlFor="subject-pick">
              Subject
            </label>
            <select
              id="subject-pick"
              class="slot-select"
              value={base ?? ''}
              onChange={(e) => setBase((e.target as HTMLSelectElement).value || null)}
            >
              <option value="">Choose a subject…</option>
              {GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.names.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div class="subj-level">
              <span class="help" id="subject-level-h">
                Level
              </span>
              <div class="seg hlsl" role="radiogroup" aria-labelledby="subject-level-h">
                <button
                  type="button"
                  aria-pressed={shownLevel === 'HL'}
                  disabled={slOnly}
                  title={slOnly ? 'Only offered at SL' : undefined}
                  onClick={() => setLevel('HL')}
                >
                  HL
                </button>
                <button type="button" aria-pressed={shownLevel === 'SL'} onClick={() => setLevel('SL')}>
                  SL
                </button>
              </div>
            </div>
            {slOnly && <p class="row-note">Only offered at SL.</p>}
          </div>
        </section>
        {base === null ? (
          <section class="section" aria-labelledby="marks-h">
            <h2 id="marks-h">Your marks</h2>
            <div class="card">
              <p class="row-note">Choose a subject above to see its components.</p>
            </div>
          </section>
        ) : entry === null ? (
          <section class="section" aria-labelledby="marks-h">
            <h2 id="marks-h">Your marks</h2>
            <div class="card">
              <p>This subject is coming soon.</p>
              <p class="help">
                Try the <a href="index.html">diploma calculator</a> for your total out of 45.
              </p>
            </div>
          </section>
        ) : (
          <section class="section" aria-labelledby="marks-h">
            <h2 id="marks-h">Your marks</h2>
            <div class="card">
              <SubjectForm
                key={`${base}|${shownLevel}|${initialMarks === undefined ? '' : 'h'}`}
                base={base}
                level={shownLevel}
                bounds={bounds}
                onBounds={setBounds}
              />
            </div>
          </section>
        )}
        <footer class="footer">
          <p>
            This work/product/service has been developed independently from and is not endorsed by
            the International Baccalaureate Organization. International Baccalaureate, Baccalauréat
            International, Bachillerato Internacional and IB are registered trademarks owned by the
            International Baccalaureate Organization.
          </p>
          <p>Estimates only. Your school and the IB decide your final results.</p>
          <p>
            <a href="https://github.com/ap0l1on/Sevens" target="_blank" rel="noreferrer">
              Source code on GitHub
            </a>
            {' · '}
            <a
              href="https://github.com/ap0l1on/Sevens/issues/new?template=wrong-result.md"
              target="_blank"
              rel="noreferrer"
            >
              Report a mistake
            </a>
            {' · '}
            <span>Rules checked against ibo.org on 2026-09-24</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

export function trackSubjectView() {
  track('faq_opened', { q: 1 });
}
