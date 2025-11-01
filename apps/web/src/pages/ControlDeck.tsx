export function ControlDeck() {
  return (
    <section>
      <h2>Control Deck</h2>
      <p>
        Moderators will manage the queue, preview upcoming characters, and trigger rounds from here. The cards below
        outline the planned controls.
      </p>

      <div className="control-grid">
        <div className="card">
          <h3>Current Round</h3>
          <p className="muted">No character live.</p>
          <div className="actions">
            <button disabled>End Round</button>
            <button disabled>Skip Character</button>
          </div>
        </div>

        <div className="card">
          <h3>Next Up</h3>
          <p className="muted">Queue is empty. Approve a submission to get started.</p>
          <div className="actions">
            <button disabled>Start Round (Yes/No)</button>
            <button disabled>Start Round (1–5)</button>
          </div>
        </div>

        <div className="card wide">
          <h3>Submission Queue</h3>
          <p className="muted">Drag-and-drop list will appear here once the backend wiring is in place.</p>
        </div>
      </div>
    </section>
  );
}
