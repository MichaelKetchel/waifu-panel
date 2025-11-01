export function AudienceVoting() {
  return (
    <section>
      <h2>Audience Voting</h2>
      <p>
        This page will listen for live round updates and present the vote UI. For now we render a static preview of the
        controls.
      </p>

      <div className="card">
        <h3>Current Character</h3>
        <p className="muted">Awaiting round start…</p>

        <div className="vote-controls">
          <button disabled>Yes</button>
          <button disabled>No</button>
        </div>

        <p className="muted">1–5 scale will replace these buttons when enabled.</p>
      </div>
    </section>
  );
}
