import { render } from 'preact';
import { useEffect, useMemo, useReducer } from 'preact/hooks';
import { calculate } from './rules/calculate';
import { duplicateSlots } from './rules/data';
import type { Input } from './rules/data';
import { planOffer } from './rules/planner';
import { defaultInput, defaultOffer, encodeState, parseState } from './rules/url';
import { FaqSection, OfferSection } from './sections';
import type { Action } from './store';
import { reducer, type State } from './store';
import './ui/tokens.css';
import './ui/app.css';

export function MoreApp() {
  const [state, dispatch] = useReducer<State, Action>(reducer, {
    input: defaultInput(),
    offer: defaultOffer(),
    calc: {
      base: null,
      level: 'HL',
      fromSlot: null,
      marks: [],
      maxEdits: [],
      bounds: null,
    },
    showSlOffer: false,
    damaged: false,
    startSnapshot: null,
    shareMsg: 'Copy link',
  });

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const parsed = parseState(hash || window.location.search);
    dispatch({
      type: 'INIT',
      input: parsed.input,
      offer: parsed.offer,
      calc: parsed.calc,
      damaged: parsed.damaged,
    });
  }, []);

  const dupFlags = useMemo(
    () => duplicateSlots(state.input.subjects.map((s) => s.name)),
    [state.input],
  );
  const engineInput = useMemo<Input>(
    () => ({
      ...state.input,
      subjects: state.input.subjects.map((s, i) =>
        dupFlags[i] ? { ...s, grade: null, locked: true } : s,
      ),
    }),
    [state.input, dupFlags],
  );
  const result = useMemo(() => calculate(engineInput), [engineInput]);
  const plan = useMemo(() => {
    const hasOffer =
      state.offer.total !== null ||
      state.offer.hl.length > 0 ||
      state.offer.sl.length > 0 ||
      state.offer.subjectMins.length > 0;
    if (!hasOffer) return null;
    try {
      return planOffer(engineInput, state.offer);
    } catch {
      return null;
    }
  }, [engineInput, state.offer]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const qs = encodeState(state.input, state.offer, state.calc);
      window.history.replaceState(null, '', qs ? `#${qs}` : window.location.pathname);
    }, 300);
    return () => window.clearTimeout(t);
  }, [state.input, state.offer, state.calc]);

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
          <a class="header-link" href="index.html#subject">
            Subject grade
          </a>
          <a class="header-link" href="more.html" aria-current="page">
            More
          </a>
        </nav>
      </header>
      <main class="main">
        <div class="hero">
          <h1>More: offers &amp; FAQ</h1>
          <p>Your current grades came along in the link. Plan your offer below.</p>
          {state.damaged && (
            <p class="row-note warn">This link was damaged, so we loaded what we could.</p>
          )}
        </div>
        <section class="section" aria-labelledby="offer-h">
          <h2 id="offer-h" tabIndex={-1}>
            Your offer
          </h2>
          <p class="help">
            Copy it from your offer letter, e.g. &quot;38 points with 7, 6, 6 at HL&quot;.
          </p>
          <div class="offer-grid card">
            <OfferSection
              offer={state.offer}
              showSlOffer={state.showSlOffer}
              subjects={state.input.subjects}
              plan={plan}
              result={result}
              dispatch={dispatch}
            />
          </div>
        </section>
        <FaqSection />
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
            <span>Rules checked against ibo.org on 2026-09-24</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  root.replaceChildren();
  render(<MoreApp />, root);
}
