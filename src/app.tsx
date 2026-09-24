import { useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import { calculate, failMessage, structureMessage } from './rules/calculate';
import {
  bandForTotal,
  SUBJECT_CATALOGUE,
  COMMON_LANGUAGES,
  type Grade,
  type Input,
  type Offer,
} from './rules/data';
import { planOffer } from './rules/planner';
import { defaultInput, defaultOffer, encodeState, parseState } from './rules/url';
import { track } from './analytics';

type State = {
  input: Input;
  offer: Offer;
  showSlOffer: boolean;
  damaged: boolean;
  startSnapshot: { input: Input; total: number } | null;
  shareMsg: string;
};

type Action =
  | { type: 'INIT'; input: Input; offer: Offer; damaged: boolean }
  | { type: 'SET_NAME'; index: number; name: string }
  | { type: 'SET_LEVEL'; index: number; level: 'HL' | 'SL' }
  | { type: 'SET_GRADE'; index: number; grade: Grade | null }
  | { type: 'TOGGLE_LOCK'; index: number }
  | { type: 'SET_TOK'; tok: Input['tok'] }
  | { type: 'SET_EE'; ee: Input['ee'] }
  | { type: 'SET_CAS'; cas: boolean }
  | { type: 'SET_OFFER_TOTAL'; total: number | null }
  | { type: 'SET_OFFER_HL'; hl: Grade[] }
  | { type: 'SET_OFFER_SL'; sl: Grade[] }
  | { type: 'ADD_SUBJECT_MIN' }
  | { type: 'SET_SUBJECT_MIN'; pos: number; index: number; min: Grade }
  | { type: 'REMOVE_SUBJECT_MIN'; pos: number }
  | { type: 'SET_SHOW_SL'; show: boolean }
  | { type: 'LOAD_EXAMPLE' }
  | { type: 'BACK_TO_START' }
  | { type: 'SET_START'; snapshot: { input: Input; total: number } }
  | { type: 'SHARE_MSG'; msg: string };

function denizExample(): { input: Input; offer: Offer } {
  return {
    input: {
      subjects: [
        { name: 'Chemistry', level: 'HL', grade: 6, locked: false },
        { name: 'Mathematics: analysis and approaches', level: 'HL', grade: 6, locked: false },
        { name: 'Physics', level: 'HL', grade: 5, locked: false },
        { name: 'English A: Language and literature', level: 'SL', grade: 5, locked: false },
        { name: 'Turkish B', level: 'SL', grade: 5, locked: false },
        { name: 'History', level: 'SL', grade: 4, locked: false },
      ],
      tok: 'B',
      ee: 'C',
      cas: true,
    },
    offer: { total: 36, hl: [], sl: [], subjectMins: [] },
  };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'INIT':
      return { ...s, input: a.input, offer: a.offer, damaged: a.damaged };
    case 'SET_NAME': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, name: a.name.slice(0, 40) } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_LEVEL': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, level: a.level } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_GRADE': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, grade: a.grade } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'TOGGLE_LOCK': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, locked: !sub.locked } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_TOK':
      return { ...s, input: { ...s.input, tok: a.tok } };
    case 'SET_EE':
      return { ...s, input: { ...s.input, ee: a.ee } };
    case 'SET_CAS':
      return { ...s, input: { ...s.input, cas: a.cas } };
    case 'SET_OFFER_TOTAL':
      return { ...s, offer: { ...s.offer, total: a.total } };
    case 'SET_OFFER_HL':
      return { ...s, offer: { ...s.offer, hl: a.hl } };
    case 'SET_OFFER_SL':
      return { ...s, offer: { ...s.offer, sl: a.sl } };
    case 'ADD_SUBJECT_MIN': {
      if (s.offer.subjectMins.length >= 3) return s;
      return {
        ...s,
        offer: { ...s.offer, subjectMins: [...s.offer.subjectMins, { index: 0, min: 7 as Grade }] },
      };
    }
    case 'SET_SUBJECT_MIN': {
      const subjectMins = s.offer.subjectMins.map((m, i) =>
        i === a.pos ? { index: a.index, min: a.min } : m,
      );
      return { ...s, offer: { ...s.offer, subjectMins } };
    }
    case 'REMOVE_SUBJECT_MIN': {
      return {
        ...s,
        offer: { ...s.offer, subjectMins: s.offer.subjectMins.filter((_, i) => i !== a.pos) },
      };
    }
    case 'SET_SHOW_SL':
      return { ...s, showSlOffer: a.show };
    case 'LOAD_EXAMPLE': {
      const ex = denizExample();
      return { ...s, input: ex.input, offer: ex.offer };
    }
    case 'BACK_TO_START': {
      if (!s.startSnapshot) return s;
      // Deep copy to avoid mutation.
      const snap: Input = JSON.parse(JSON.stringify(s.startSnapshot.input)) as Input;
      return { ...s, input: snap };
    }
    case 'SET_START':
      return { ...s, startSnapshot: s.startSnapshot ?? a.snapshot };
    case 'SHARE_MSG':
      return { ...s, shareMsg: a.msg };
    default:
      return s;
  }
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path d={d} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}
const CHECK_D = 'M4 10.5l4 4 8-9';
const CROSS_D = 'M5 5l10 10M15 5L5 15';

function SubjectRow({
  index,
  name,
  level,
  grade,
  locked,
  dispatch,
  hlDisabledReason,
}: {
  index: number;
  name: string;
  level: 'HL' | 'SL';
  grade: Grade | null;
  locked: boolean;
  dispatch: (a: Action) => void;
  hlDisabledReason: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(name);
  useEffect(() => setQ(name), [name]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const groups = SUBJECT_CATALOGUE.map((g) => ({
      group: g.group,
      items: g.subjects.filter((s) => !needle || s.name.toLowerCase().includes(needle)),
    })).filter((g) => g.items.length > 0);
    return groups;
  }, [q]);

  const label = `${name.trim() || `Subject ${index + 1}`} ${level} grade`;

  function onKey(e: KeyboardEvent) {
    const k = e.key;
    if (k >= '1' && k <= '7') {
      const g = Number(k) as Grade;
      dispatch({ type: 'SET_GRADE', index, grade: grade === g ? null : g });
    } else if (k === 'h' || k === 'H') {
      if (!hlDisabledReason) dispatch({ type: 'SET_LEVEL', index, level: 'HL' });
    } else if (k === 's' || k === 'S') {
      dispatch({ type: 'SET_LEVEL', index, level: 'SL' });
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      if (grade === null) dispatch({ type: 'SET_GRADE', index, grade: 1 });
      else if (grade < 7) dispatch({ type: 'SET_GRADE', index, grade: (grade + 1) as Grade });
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      if (grade === null) dispatch({ type: 'SET_GRADE', index, grade: 7 });
      else if (grade > 1) dispatch({ type: 'SET_GRADE', index, grade: (grade - 1) as Grade });
    } else if (k === 'Delete' || k === 'Backspace') {
      // Only clear grade when focus is not in text input (avoid deleting name text).
      const t = e.target as HTMLElement;
      if (t.tagName !== 'INPUT' || (t as HTMLInputElement).inputMode !== 'text') {
        // If in name input, let Backspace edit text.
        if (t.tagName === 'INPUT') return;
        dispatch({ type: 'SET_GRADE', index, grade: null });
      }
    }
  }

  return (
    <div class="subj-row" onKeyDown={onKey as unknown as (e: Event) => void}>
      <div class="subj-line1">
        <div class="combo">
          <input
            aria-label={`Subject ${index + 1} name`}
            placeholder={`Subject ${index + 1}`}
            value={q}
            inputMode="text"
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setQ(v);
              setOpen(true);
              dispatch({ type: 'SET_NAME', index, name: v });
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {open && (
            <div class="combo-list" role="listbox" aria-label="Subject suggestions">
              {filtered.map((g) => (
                <div key={g.group}>
                  <div class="combo-group">{g.group}</div>
                  {g.items.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      role="option"
                      aria-selected={name === s.name}
                      class="combo-opt"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        dispatch({ type: 'SET_NAME', index, name: s.name });
                        setQ(s.name);
                        setOpen(false);
                      }}
                    >
                      {s.name}
                      {s.slOnly ? ' (SL)' : ''}
                    </button>
                  ))}
                </div>
              ))}
              <div class="combo-group">Languages</div>
              <div style={{ padding: '0 8px 8px', color: 'var(--muted)', fontSize: '14px' }}>
                For Language A, B, ab initio: add language, e.g. English, Turkish. Quick picks:{' '}
                {COMMON_LANGUAGES.slice(0, 6).join(', ')}.
              </div>
            </div>
          )}
        </div>
        <div class="seg hlsl" role="group" aria-label={`Subject ${index + 1} level`}>
          <button
            type="button"
            aria-pressed={level === 'HL'}
            disabled={hlDisabledReason !== null}
            title={hlDisabledReason ?? undefined}
            onClick={() => dispatch({ type: 'SET_LEVEL', index, level: 'HL' })}
          >
            HL
          </button>
          <button
            type="button"
            aria-pressed={level === 'SL'}
            onClick={() => dispatch({ type: 'SET_LEVEL', index, level: 'SL' })}
          >
            SL
          </button>
        </div>
        <button
          type="button"
          class="lock-btn"
          aria-pressed={locked}
          aria-label={locked ? `Unlock subject ${index + 1}` : `Lock subject ${index + 1}`}
          title="Lock this grade. The planner won't change it."
          onClick={() => dispatch({ type: 'TOGGLE_LOCK', index })}
        >
          {locked ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <rect x="4" y="8" width="12" height="8" rx="2" />
              <path d="M6.5 8V6a3.5 3.5 0 017 0v2" stroke-linecap="round" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <rect x="4" y="8" width="12" height="8" rx="2" />
              <path d="M6.5 8V6a3.5 3.5 0 016.8-1.2" stroke-linecap="round" />
            </svg>
          )}
        </button>
      </div>
      <div class="grade-row" role="radiogroup" aria-label={label}>
        {([1, 2, 3, 4, 5, 6, 7] as Grade[]).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={grade === g}
            aria-label={`${g}`}
            class="grade-btn seg"
            style={{
              border: '1px solid var(--control)',
              background: grade === g ? 'var(--accent)' : 'var(--surface-2)',
              color: grade === g ? 'var(--on-accent)' : 'var(--text)',
            }}
            onClick={() => dispatch({ type: 'SET_GRADE', index, grade: grade === g ? null : g })}
          >
            {g}
          </button>
        ))}
      </div>
      {grade === 1 && <p class="row-note bad">A grade 1 means no diploma, whatever the total.</p>}
    </div>
  );
}

export function App() {
  const [state, dispatch] = useReducer<State, Action>(reducer, {
    input: defaultInput(),
    offer: defaultOffer(),
    showSlOffer: false,
    damaged: false,
    startSnapshot: null,
    shareMsg: 'Copy link',
  });
  const result = useMemo(() => calculate(state.input), [state.input]);
  const plan = useMemo(() => {
    const hasOffer =
      state.offer.total !== null ||
      state.offer.hl.length > 0 ||
      state.offer.sl.length > 0 ||
      state.offer.subjectMins.length > 0;
    if (!hasOffer) return null;
    if (
      result.status !== 'on_track' &&
      result.status !== 'not_on_track' &&
      result.status !== 'incomplete' &&
      result.status !== 'invalid'
    )
      return null;
    try {
      return planOffer(state.input, state.offer);
    } catch {
      return null;
    }
  }, [state.input, state.offer, result.status]);

  const trackedCalc = useRef(false);
  const trackedOffer = useRef(false);
  const trackedWhatIf = useRef(false);
  const hadFullResult = useRef(false);
  const liveRef = useRef<HTMLDivElement>(null);
  const [liveText, setLiveText] = useState('');
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  // Init from URL hash. Grades and offer state live in the hash (#...),
  // never the query string, so they are never sent to any server.
  // Legacy query-string links (?s=...) are migrated once into the hash.
  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const parsed = parseState(hash || window.location.search);
    dispatch({ type: 'INIT', input: parsed.input, offer: parsed.offer, damaged: parsed.damaged });
  }, []);

  // Hash sync after 300ms no input.
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = encodeState(state.input, state.offer);
      window.history.replaceState(null, '', qs ? `#${qs}` : window.location.pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [state.input, state.offer]);

  // What-if starting point: first full result.
  useEffect(() => {
    if (
      (result.status === 'on_track' || result.status === 'not_on_track') &&
      result.total !== null
    ) {
      if (!hadFullResult.current) {
        hadFullResult.current = true;
        dispatch({
          type: 'SET_START',
          snapshot: {
            input: JSON.parse(JSON.stringify(state.input)) as Input,
            total: result.total,
          },
        });
      }
    }
  }, [result.status, result.total]);

  // whatif_used: first grade change after full result.
  useEffect(() => {
    if (hadFullResult.current && !trackedWhatIf.current) {
      // If start exists and current differs, track once.
      if (
        state.startSnapshot &&
        JSON.stringify(state.input) !== JSON.stringify(state.startSnapshot.input)
      ) {
        trackedWhatIf.current = true;
        track('whatif_used');
      }
    }
  }, [state.input, state.startSnapshot]);

  // calc_completed + pass_check_failed once per load.
  useEffect(() => {
    if (
      !trackedCalc.current &&
      (result.status === 'on_track' || result.status === 'not_on_track')
    ) {
      trackedCalc.current = true;
      track('calc_completed', { status: result.status, hl_count: result.hlCount });
      if (result.status === 'not_on_track' && result.fails.length > 0) {
        track('pass_check_failed', { first_code: result.fails[0] as string });
      }
    }
  }, [result.status, result.hlCount, result.fails]);

  // offer_planned once per load.
  useEffect(() => {
    if (!trackedOffer.current && plan) {
      trackedOffer.current = true;
      const r = plan.kind === 'ALREADY_MET' ? 'ALREADY_MET' : plan.kind;
      track('offer_planned', { result: r });
    }
  }, [plan]);

  // aria-live debounced 500ms.
  useEffect(() => {
    const t = setTimeout(() => {
      if (result.total !== null) {
        setLiveText(
          `${result.total} out of 45, diploma ${result.status === 'on_track' ? 'on track' : result.status === 'not_on_track' ? 'not on track' : result.status}`,
        );
      } else if (result.status === 'incomplete') {
        setLiveText(`${result.subjectPoints} points so far`);
      } else {
        setLiveText('');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [result]);

  // Sticky bar visibility via IntersectionObserver.
  useEffect(() => {
    const el = resultCardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setShowSticky(!e?.isIntersecting && window.innerWidth < 960 && result.total !== null);
      },
      { threshold: 0 },
    );
    obs.observe(el);
    const onResize = () => {
      if (window.innerWidth >= 960) setShowSticky(false);
    };
    window.addEventListener('resize', onResize);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [result.total]);

  async function share() {
    const qs = encodeState(state.input, state.offer);
    const url = `${window.location.origin}${window.location.pathname}#${qs}`;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent);
    if (
      mobile &&
      (
        window.navigator as unknown as {
          share?: (d: { title: string; text: string; url: string }) => Promise<void>;
        }
      ).share
    ) {
      try {
        await (window.navigator as unknown as { share: (d: unknown) => Promise<void> }).share({
          title: 'Sevens',
          text: 'My IB Diploma setup',
          url,
        });
        track('share_clicked', { method: 'web_share' });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await window.navigator.clipboard.writeText(url);
      dispatch({ type: 'SHARE_MSG', msg: 'Link copied' });
      track('share_clicked', { method: 'clipboard' });
      setTimeout(() => dispatch({ type: 'SHARE_MSG', msg: 'Copy link' }), 2000);
    } catch {
      window.prompt('Copy this link:', url);
      track('share_clicked', { method: 'clipboard' });
    }
  }

  const slOnlyAt: (string | null)[] = state.input.subjects.map((s) => {
    const n = s.name.toLowerCase();
    if (
      n.includes('ab initio') ||
      n.includes('world religions') ||
      n.includes('literature and performance') ||
      n.includes('school-based syllabus') ||
      n.includes('school based syllabus')
    ) {
      return 'Only offered at SL';
    }
    return null;
  });

  // Count rules for row notes (2s/3s over limit).
  const gradesAll = state.input.subjects.map((s) => s.grade);
  const count2 = gradesAll.filter((g) => g === 2).length;
  const countLe3 = gradesAll.filter((g) => g !== null && (g as number) <= 3).length;

  const band = result.total !== null ? bandForTotal(result.total) : null;

  return (
    <div class="page">
      <header class="header">
        <a class="wordmark" href="/" aria-label="Sevens home">
          <span class="mark" aria-hidden="true">
            7
          </span>
          Sevens
        </a>
        <a class="header-link" href="#faq">
          How it works
        </a>
      </header>
      <main class="main">
        <div class="hero">
          <h1>Your IB Diploma total, and what you need for your offer.</h1>
          <p>Free. Nothing is saved or sent anywhere. Works for the November and May sessions.</p>
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => {
              dispatch({ type: 'LOAD_EXAMPLE' });
              track('example_loaded');
            }}
          >
            Try an example
          </button>
          {state.damaged && (
            <p class="row-note warn">This link was damaged, so we loaded what we could.</p>
          )}
        </div>

        <div class="layout">
          <div>
            <section class="section" aria-labelledby="subjects-h">
              <h2 id="subjects-h">Subjects</h2>
              <div class="subj-list">
                {state.input.subjects.map((s, i) => (
                  <div key={i}>
                    <SubjectRow
                      index={i}
                      name={s.name}
                      level={s.level}
                      grade={s.grade}
                      locked={s.locked}
                      dispatch={dispatch}
                      hlDisabledReason={slOnlyAt[i] ?? null}
                    />
                    {(s.grade === 2 || s.grade === 3) && (count2 > 2 || countLe3 > 3) && (
                      <p class="row-note warn">This grade counts toward the 2s and 3s limits.</p>
                    )}
                  </div>
                ))}
              </div>
              {state.input.subjects.length !== 6 && (
                <p class="row-note">Add {6 - state.input.subjects.length} more subjects</p>
              )}
            </section>

            <section class="section" aria-labelledby="core-h">
              <h2 id="core-h">Core</h2>
              <div class="core-grid">
                <div>
                  <div class="help" id="tok-h">
                    TOK grade
                  </div>
                  <div class="seg tok-row" role="radiogroup" aria-labelledby="tok-h">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="radio"
                        aria-checked={state.input.tok === g}
                        aria-pressed={state.input.tok === g}
                        onClick={() =>
                          dispatch({ type: 'SET_TOK', tok: state.input.tok === g ? null : g })
                        }
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div class="help" id="ee-h">
                    Extended Essay grade
                  </div>
                  <div class="seg tok-row" role="radiogroup" aria-labelledby="ee-h">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="radio"
                        aria-checked={state.input.ee === g}
                        aria-pressed={state.input.ee === g}
                        onClick={() =>
                          dispatch({ type: 'SET_EE', ee: state.input.ee === g ? null : g })
                        }
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <label class="cas-row">
                  <span
                    class="switch"
                    data-on={state.input.cas ? 'true' : 'false'}
                    aria-hidden="true"
                  />
                  <input
                    type="checkbox"
                    checked={state.input.cas}
                    onChange={(e) =>
                      dispatch({ type: 'SET_CAS', cas: (e.target as HTMLInputElement).checked })
                    }
                    style={{ position: 'absolute', opacity: 0, width: '44px', height: '44px' }}
                    aria-label="CAS complete or on track"
                  />
                  <span>CAS complete or on track</span>
                </label>
              </div>
            </section>

            <section class="section" aria-labelledby="offer-h">
              <h2 id="offer-h">Your offer</h2>
              <p class="help">
                Copy it from your offer letter, e.g. &quot;38 points with 7, 6, 6 at HL&quot;.
              </p>
              <div class="offer-grid card">
                <label>
                  <span class="help">Total points (24–45)</span>
                  <input
                    type="number"
                    min={24}
                    max={45}
                    value={state.offer.total ?? ''}
                    placeholder="e.g. 38"
                    inputMode="numeric"
                    style={{
                      display: 'block',
                      height: '44px',
                      borderRadius: '12px',
                      border: '1px solid var(--control)',
                      padding: '0 12px',
                      fontSize: '16px',
                      width: '160px',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                    onInput={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      if (v === '') dispatch({ type: 'SET_OFFER_TOTAL', total: null });
                      else {
                        const n = Number(v);
                        if (Number.isInteger(n) && n >= 24 && n <= 45)
                          dispatch({ type: 'SET_OFFER_TOTAL', total: n });
                      }
                    }}
                  />
                </label>
                <div>
                  <span class="help">HL grades needed (e.g. 7 6 6)</span>
                  <div class="offer-row">
                    {[0, 1, 2, 3].map((pos) => (
                      <select
                        key={pos}
                        aria-label={`HL requirement ${pos + 1}`}
                        value={state.offer.hl[pos] ?? ''}
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          minWidth: '64px',
                          fontSize: '16px',
                        }}
                        onChange={(e) => {
                          const v = (e.target as HTMLSelectElement).value;
                          const cur = [...state.offer.hl];
                          // Ensure length: pad with current values.
                          while (cur.length <= pos) cur.push(7 as Grade);
                          if (v === '') {
                            const next = state.offer.hl.filter((_, i) => i !== pos);
                            dispatch({ type: 'SET_OFFER_HL', hl: next });
                          } else {
                            const g = Number(v) as Grade;
                            const next = [...state.offer.hl];
                            if (pos < next.length) next[pos] = g;
                            else {
                              while (next.length < pos) next.push(g);
                              next.push(g);
                            }
                            next.sort((a, b) => b - a);
                            dispatch({ type: 'SET_OFFER_HL', hl: next.slice(0, 4) });
                          }
                        }}
                      >
                        <option value="">—</option>
                        {[7, 6, 5, 4, 3, 2, 1].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
                {!state.showSlOffer ? (
                  <button
                    type="button"
                    class="btn btn-ghost"
                    onClick={() => dispatch({ type: 'SET_SHOW_SL', show: true })}
                  >
                    Add SL requirement
                  </button>
                ) : (
                  <div>
                    <span class="help">SL grades needed</span>
                    <div class="offer-row">
                      {[0, 1, 2].map((pos) => (
                        <select
                          key={pos}
                          aria-label={`SL requirement ${pos + 1}`}
                          value={state.offer.sl[pos] ?? ''}
                          style={{
                            height: '44px',
                            borderRadius: '8px',
                            minWidth: '64px',
                            fontSize: '16px',
                          }}
                          onChange={(e) => {
                            const v = (e.target as HTMLSelectElement).value;
                            if (v === '') {
                              dispatch({
                                type: 'SET_OFFER_SL',
                                sl: state.offer.sl.filter((_, i) => i !== pos),
                              });
                            } else {
                              const g = Number(v) as Grade;
                              const next = [...state.offer.sl];
                              if (pos < next.length) next[pos] = g;
                              else {
                                while (next.length < pos) next.push(g);
                                next.push(g);
                              }
                              next.sort((a, b) => b - a);
                              dispatch({ type: 'SET_OFFER_SL', sl: next.slice(0, 3) });
                            }
                          }}
                        >
                          <option value="">—</option>
                          {[7, 6, 5, 4, 3, 2, 1].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span class="help">Subject minimum (up to 3)</span>
                  {state.offer.subjectMins.map((m, pos) => (
                    <div key={pos} class="offer-row" style={{ marginBottom: '8px' }}>
                      <select
                        aria-label={`Subject minimum ${pos + 1} subject`}
                        value={m.index}
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          maxWidth: '220px',
                        }}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_SUBJECT_MIN',
                            pos,
                            index: Number((e.target as HTMLSelectElement).value),
                            min: m.min,
                          })
                        }
                      >
                        {state.input.subjects.map((s, i) => (
                          <option key={i} value={i}>
                            #{i + 1} {s.name || `Subject ${i + 1}`} ({s.level})
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={`Subject minimum ${pos + 1} grade`}
                        value={m.min}
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          minWidth: '64px',
                          fontSize: '16px',
                        }}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_SUBJECT_MIN',
                            pos,
                            index: m.index,
                            min: Number((e.target as HTMLSelectElement).value) as Grade,
                          })
                        }
                      >
                        {[7, 6, 5, 4, 3, 2, 1].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        class="btn btn-ghost"
                        onClick={() => dispatch({ type: 'REMOVE_SUBJECT_MIN', pos })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {state.offer.subjectMins.length < 3 && (
                    <button
                      type="button"
                      class="btn btn-ghost"
                      onClick={() => dispatch({ type: 'ADD_SUBJECT_MIN' })}
                    >
                      Add subject minimum
                    </button>
                  )}
                </div>
                <div aria-live="polite">
                  {plan === null && (
                    <p class="row-note">Add an offer to see the grades you need.</p>
                  )}
                  {plan?.kind === 'ALREADY_MET' && (
                    <p>
                      <strong>You already meet this offer.</strong> You have {plan.margin} points of
                      margin on the total.
                    </p>
                  )}
                  {plan?.kind === 'PLAN' && (
                    <div>
                      <p>
                        <strong>Raise {plan.changes.length} grades to meet it:</strong>
                      </p>
                      <ul class="plan-list">
                        {plan.changes.map((c) => {
                          const sub = state.input.subjects[c.index];
                          return (
                            <li key={c.index}>
                              <span class="plan-hl">
                                {sub?.name || `Subject ${c.index + 1}`} {sub?.level}:{' '}
                                {c.from ?? '—'} → {c.to}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <p>That gives {plan.newTotal}/45, diploma on track.</p>
                      {plan.alternatives.length > 0 && (
                        <details>
                          <summary>Other ways ({plan.alternatives.length})</summary>
                          {plan.alternatives.map((alt, ai) => (
                            <ul key={ai} class="plan-list">
                              {alt.changes.map((c) => {
                                const sub = state.input.subjects[c.index];
                                return (
                                  <li key={c.index}>
                                    {sub?.name || `Subject ${c.index + 1}`}: {c.from ?? '—'} →{' '}
                                    {c.to}
                                  </li>
                                );
                              })}
                            </ul>
                          ))}
                        </details>
                      )}
                    </div>
                  )}
                  {plan?.kind === 'UNREACHABLE' && (
                    <p>
                      <strong>Not reachable with these settings.</strong> Even with every unlocked
                      subject at 7 you&apos;d have {plan.maxTotal}. Try unlocking a subject or check
                      the offer.
                    </p>
                  )}
                  {plan?.kind === 'BLOCKED' && (
                    <p>
                      <strong>Grades alone can&apos;t fix this:</strong>{' '}
                      {plan.codes
                        .map((c) => {
                          const ctx = {
                            total: result.total,
                            hlPoints: result.hlPoints,
                            slPoints: result.slPoints,
                            subjects: state.input.subjects.map((s) => ({
                              name: s.name,
                              grade: s.grade,
                            })),
                          };
                          return failMessage(c, ctx);
                        })
                        .join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section class="section faq" id="faq" aria-labelledby="faq-h">
              <h2 id="faq-h">How it works</h2>
              {[
                {
                  q: 'How is the IB total calculated?',
                  a: 'Add your six subject grades (each 1–7) to get up to 42 points, then add 0–3 core points from TOK and the Extended Essay. The maximum is 45. HL and SL grades count equally toward the total.',
                },
                {
                  q: 'How do TOK and EE points work?',
                  a: 'TOK and EE are each graded A–E. Together they give 0–3 points. An E in either means no diploma. For example, A/A gives 3, B/C gives 2, and C/D gives 0.',
                },
                {
                  q: 'What are the diploma failing conditions?',
                  a: 'You need 24+ points, CAS complete, no E in TOK or EE, no grade 1, at most two grade 2s, at most three grades of 3 or below, 12+ HL points and 9+ SL points (or 5+ with two SL subjects).',
                },
                {
                  q: 'What if I take 4 HL subjects?',
                  a: 'Only the three highest HL grades count for the 12-point rule, and with two SL subjects you need at least 5 SL points. The page says when this applies.',
                },
                {
                  q: 'Does SL count less than HL?',
                  a: 'No. Every subject grade counts equally toward the total out of 45. Levels only matter for the 12-point HL and 9- or 5-point SL rules.',
                },
                {
                  q: 'Are these official grade boundaries?',
                  a: 'No. Grade boundaries are given only to coordinators, so this calculator works on grades 1–7 only. Estimates only. Your school and the IB decide your final results.',
                },
              ].map((item, i) => (
                <details
                  key={i}
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) track('faq_opened', { q: i + 1 });
                  }}
                >
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </section>
          </div>

          <div class="result-wrap">
            <section
              class="card result-card"
              ref={resultCardRef as unknown as never}
              aria-live="polite"
              aria-label="Result"
            >
              <div
                ref={liveRef}
                class="sr-only"
                aria-live="polite"
                style={{ position: 'absolute', left: '-9999px' }}
              >
                {liveText}
              </div>
              {result.status === 'invalid' && (
                <div>
                  <div class="total-display">
                    —<span class="total-sub">/45</span>
                  </div>
                  <p>
                    <span class="chip grey">Check setup</span>
                  </p>
                  <p>
                    {structureMessage(
                      result.structure,
                      state.input.subjects.length,
                      result.hlCount,
                    )}
                  </p>
                </div>
              )}
              {result.status === 'incomplete' && result.totalRange && (
                <div>
                  <div class="total-display num">
                    {result.totalRange[0]}–{result.totalRange[1]}
                    <span class="total-sub">/45</span>
                  </div>
                  <p>Add TOK and EE to get your exact total. They add 0–3 points.</p>
                </div>
              )}
              {result.status === 'incomplete' &&
                !result.totalRange &&
                result.subjectPoints === 0 && (
                  <div>
                    <div class="total-display">
                      —<span class="total-sub">/45</span>
                    </div>
                    <p>Pick a grade for each subject to see your total.</p>
                  </div>
                )}
              {result.status === 'incomplete' && !result.totalRange && result.subjectPoints > 0 && (
                <div>
                  <div class="total-display num">
                    {result.subjectPoints} <span class="total-sub">so far</span>
                  </div>
                  <p>{result.missing.subjects} subjects to go.</p>
                </div>
              )}
              {(result.status === 'on_track' || result.status === 'not_on_track') && (
                <div>
                  <div class="total-display num">
                    {result.total}
                    <span class="total-sub">/45</span>
                  </div>
                  {result.status === 'on_track' ? (
                    <p>
                      <span class="chip ok">
                        <Icon d={CHECK_D} /> Diploma on track
                      </span>
                    </p>
                  ) : (
                    <p>
                      <span class="chip bad">
                        <Icon d={CROSS_D} /> Diploma not on track
                      </span>
                    </p>
                  )}
                  {result.status === 'on_track' ? (
                    <div>
                      <p class="breakdown">
                        HL {result.hlPoints} · SL {result.slPoints} · Core {result.corePoints} (TOK{' '}
                        {state.input.tok} + EE {state.input.ee})
                        {result.hlCount === 4 ? ' (top 3 HL count for the 12-point rule)' : ''}
                      </p>
                      {band && (
                        <div>
                          <div class="band" aria-hidden="true">
                            {['0–23', '24–29', '30–34', '35–39', '40–45'].map((b) => (
                              <span key={b} class={band.label === b ? 'on' : ''} />
                            ))}
                          </div>
                          <p class="band-cap">
                            {band.share}% of May 2025 diploma candidates scored {band.label}.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>
                        Even with {result.total} points, the diploma isn&apos;t awarded because:
                      </p>
                      <ul class="fail-list">
                        {result.fails.map((f) => (
                          <li key={f}>
                            {failMessage(f, {
                              total: result.total,
                              hlPoints: result.hlPoints,
                              slPoints: result.slPoints,
                              subjects: state.input.subjects.map((s) => ({
                                name: s.name,
                                grade: s.grade,
                              })),
                            })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {state.startSnapshot &&
                    result.total !== null &&
                    result.total !== state.startSnapshot.total && (
                      <p>
                        <span class="chip delta">
                          {result.total - state.startSnapshot.total > 0
                            ? `+${result.total - state.startSnapshot.total}`
                            : `${result.total - state.startSnapshot.total}`}{' '}
                          since start
                        </span>{' '}
                        <button
                          type="button"
                          class="linklike"
                          onClick={() => dispatch({ type: 'BACK_TO_START' })}
                        >
                          Back to start
                        </button>
                      </p>
                    )}
                  <button type="button" class="btn" onClick={share}>
                    {state.shareMsg === 'Copy link' ? 'Copy link' : 'Link copied'}
                  </button>
                </div>
              )}
              {result.status === 'invalid' && (
                <button type="button" class="btn" onClick={share} style={{ marginTop: '12px' }}>
                  {state.shareMsg === 'Copy link' ? 'Copy link' : 'Link copied'}
                </button>
              )}
              {result.status === 'incomplete' && (
                <button type="button" class="btn" onClick={share} style={{ marginTop: '12px' }}>
                  {state.shareMsg === 'Copy link' ? 'Copy link' : 'Link copied'}
                </button>
              )}
            </section>
          </div>
        </div>

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
              onClick={() => track('report_clicked')}
            >
              Report a mistake
            </a>
            {' · '}
            <span>Rules checked against ibo.org on 2026-09-24</span>
          </p>
        </footer>
      </main>
      {showSticky && result.total !== null && (
        <button
          type="button"
          class="sticky-bar"
          onClick={() =>
            resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          aria-label={`Scroll to result: ${result.total} out of 45`}
        >
          <span class="sticky-total num">{result.total}/45</span>
          {result.status === 'on_track' && (
            <span class="chip ok">
              <Icon d={CHECK_D} /> On track
            </span>
          )}
          {result.status === 'not_on_track' && (
            <span class="chip bad">
              <Icon d={CROSS_D} /> Not on track
            </span>
          )}
        </button>
      )}
    </div>
  );
}
