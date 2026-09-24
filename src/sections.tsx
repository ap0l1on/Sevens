import { failMessage } from './rules/calculate';
import type { Result } from './rules/data';
import type { Grade, Input, Offer } from './rules/data';
import type { PlannerResult } from './rules/planner';
import type { Action } from './store';
import { track } from './analytics';

export function OfferSection({
  offer,
  showSlOffer,
  subjects,
  plan,
  result,
  dispatch,
}: {
  offer: Offer;
  showSlOffer: boolean;
  subjects: Input['subjects'];
  plan: PlannerResult | null;
  result: Result;
  dispatch: (a: Action) => void;
}) {
  return (
    <div class="offer-grid card">
      <label>
        <span class="help">Total points (24–45)</span>
        <input
          type="number"
          min={24}
          max={45}
          value={offer.total ?? ''}
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
              value={offer.hl[pos] ?? ''}
              style={{
                height: '44px',
                borderRadius: '8px',
                minWidth: '64px',
                fontSize: '16px',
              }}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                const cur = [...offer.hl];
                // Ensure length: pad with current values.
                while (cur.length <= pos) cur.push(7 as Grade);
                if (v === '') {
                  const next = offer.hl.filter((_, i) => i !== pos);
                  dispatch({ type: 'SET_OFFER_HL', hl: next });
                } else {
                  const g = Number(v) as Grade;
                  const next = [...offer.hl];
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
      {!showSlOffer ? (
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
                value={offer.sl[pos] ?? ''}
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
                      sl: offer.sl.filter((_, i) => i !== pos),
                    });
                  } else {
                    const g = Number(v) as Grade;
                    const next = [...offer.sl];
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
        {offer.subjectMins.map((m, pos) => (
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
              {subjects.map((s, i) => (
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
        {offer.subjectMins.length < 3 && (
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
        {plan === null && <p class="row-note">Add an offer to see the grades you need.</p>}
        {plan?.kind === 'ALREADY_MET' && (
          <p>
            <strong>You already meet this offer.</strong> You have {plan.margin} points of margin on
            the total.
          </p>
        )}
        {plan?.kind === 'PLAN' && (
          <div>
            <p>
              <strong>Raise {plan.changes.length} grades to meet it:</strong>
            </p>
            <ul class="plan-list">
              {plan.changes.map((c) => {
                const sub = subjects[c.index];
                return (
                  <li key={c.index}>
                    <span class="plan-hl">
                      {sub?.name || `Subject ${c.index + 1}`} {sub?.level}: {c.from ?? '—'} → {c.to}
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
                      const sub = subjects[c.index];
                      return (
                        <li key={c.index}>
                          {sub?.name || `Subject ${c.index + 1}`}: {c.from ?? '—'} → {c.to}
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
            <strong>Not reachable with these settings.</strong> Even with every unlocked subject at
            7 you&apos;d have {plan.maxTotal}. Try unlocking a subject or check the offer.
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
                  subjects: subjects.map((s) => ({
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
  );
}

export function FaqSection() {
  return (
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
  );
}
