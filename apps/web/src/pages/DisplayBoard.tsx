export function DisplayBoard() {
  return (
    <section>
      <h2>Display Board</h2>
      <p>
        This projector-friendly view will show the current character, image, and live tallies. The layout below is a
        placeholder.
      </p>

      <div className="display-board">
        <div className="display-image">[ character art ]</div>
        <div className="display-metadata">
          <h3>Character Name</h3>
          <p className="muted">Series Name</p>
          <div className="tally-grid">
            <div className="tally">
              <span className="label">Yes</span>
              <span className="value">0</span>
            </div>
            <div className="tally">
              <span className="label">No</span>
              <span className="value">0</span>
            </div>
            <div className="tally full-width">
              <span className="label">Audience comments will scroll here</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
