'use client';

import { useMemo, useState } from 'react';

type Decision = {
  state: 'allowed' | 'review' | 'blocked';
  title: string;
  detail: string;
};

export default function PolicySimulator() {
  const [proposedTotal, setProposedTotal] = useState(22.5);
  const [reviewThreshold, setReviewThreshold] = useState(20);
  const [hardLimit, setHardLimit] = useState(30);

  const decision = useMemo<Decision>(() => {
    if (proposedTotal > hardLimit) {
      return {
        state: 'blocked',
        title: 'Blocked by deterministic limit',
        detail: `$${proposedTotal.toFixed(2)} exceeds the configured $${hardLimit.toFixed(2)} order ceiling.`,
      };
    }
    if (proposedTotal >= reviewThreshold) {
      return {
        state: 'review',
        title: 'Explicit review required',
        detail: `$${proposedTotal.toFixed(2)} is within the hard limit but meets the $${reviewThreshold.toFixed(2)} review threshold.`,
      };
    }
    return {
      state: 'allowed',
      title: 'Eligible for customer confirmation',
      detail: 'The amount passes the configured limits. Checkout still requires the customer to confirm.',
    };
  }, [hardLimit, proposedTotal, reviewThreshold]);

  const updateNumber = (setter: (value: number) => void, value: string) => {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
  };

  return (
    <section className="aisle-policy-card" aria-labelledby="policy-simulator-title">
      <div className="aisle-evidence-section-head">
        <div>
          <p>LOCAL POLICY MOCK</p>
          <h2 id="policy-simulator-title">See deterministic approval logic before checkout.</h2>
        </div>
        <span className="aisle-evidence-badge">SIMULATION ONLY</span>
      </div>
      <div className="aisle-policy-layout">
        <form className="aisle-policy-controls" onSubmit={(event) => event.preventDefault()}>
          <label>
            Proposed cart total
            <span><b>$</b><input type="number" min="0" step="0.5" value={proposedTotal} onChange={(event) => updateNumber(setProposedTotal, event.target.value)} /></span>
          </label>
          <label>
            Require review at
            <span><b>$</b><input type="number" min="0" step="1" value={reviewThreshold} onChange={(event) => updateNumber(setReviewThreshold, event.target.value)} /></span>
          </label>
          <label>
            Hard order ceiling
            <span><b>$</b><input type="number" min="0" step="1" value={hardLimit} onChange={(event) => updateNumber(setHardLimit, event.target.value)} /></span>
          </label>
        </form>
        <div className={`aisle-policy-decision is-${decision.state}`} role="status" aria-live="polite">
          <i className={decision.state === 'allowed' ? 'fas fa-check' : decision.state === 'review' ? 'fas fa-user-check' : 'fas fa-ban'} />
          <small>DETERMINISTIC RESULT</small>
          <h3>{decision.title}</h3>
          <p>{decision.detail}</p>
          <ul>
            <li>Does not call Gemini</li>
            <li>Does not authorize payment</li>
            <li>Does not create or modify an order</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
