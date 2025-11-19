import { useQuery } from '@tanstack/react-query';

import { fetchQueue } from '../api/queue';
import { useQueueSocket } from '../socket/useQueueSocket';
import { resolveImageUrl } from '../utils/media';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';

export function DisplayBoard() {
  useQueueSocket('/display');
  useRoundSocket('/display');
  const roundQuery = useRoundState();

  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: fetchQueue,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false
  });

  const queue = queueQuery.data?.queue ?? [];
  const upcoming = queue.slice(0, 3);
  const currentRound = roundQuery.data;

  return (
    <section className="projector">
      <header className="projector__header">
        <div>
          <h2>Current Roast</h2>
          <p className="muted">Vote now at waifu-panel.local</p>
        </div>
        <div className="status-tag status-tag--live">{currentRound ? currentRound.status : 'Idle'}</div>
      </header>

      {currentRound ? (
        <LiveRoundBoard round={currentRound} />
      ) : queue.length > 0 ? (
        <UpcomingPreview next={queue[0]} upcoming={queue.slice(1, 4)} />
      ) : (
        <div className="card projector__empty">
          <p className="muted">Submissions are open! Get your waifu into the queue.</p>
        </div>
      )}

      <section className="projector__upcoming card">
        <h3>Up Next</h3>
        {upcoming.length === 0 ? (
          <p className="muted">More characters coming soon.</p>
        ) : (
          <ol className="upcoming-list-detailed">
            {upcoming.map((entry, index) => (
              <li key={entry.id}>
                <span className="position">{index + 1}</span>
                <div>
                  <strong>{entry.name}</strong>
                  {entry.series && <span className="muted">{entry.series}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function LiveRoundBoard({ round }: { round: NonNullable<ReturnType<typeof useRoundState>['data']> }) {
  return (
    <div className="display-board display-board--live">
      <div className="display-image">
        <img src={resolveImageUrl(round.character.imagePath)} alt="" />
      </div>
      <div className="display-metadata live-metadata">
        <h1>{round.character.name}</h1>
        {round.character.series && <p className="muted">{round.character.series}</p>}

        {round.mode === 'yn' ? <YesNoTallies tallies={round.tallies} /> : <ScaleTallies round={round} />}
      </div>
    </div>
  );
}

function YesNoTallies({ tallies }: { tallies: Array<{ value: number; count: number }> }) {
  const yes = tallies.find((entry) => entry.value === 1)?.count ?? 0;
  const no = tallies.find((entry) => entry.value === 0)?.count ?? 0;
  const total = Math.max(yes + no, 1);
  const yesPercent = Math.round((yes / total) * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div className="yes-no-tally">
      <div className="tally-bar">
        <div className="tally-bar__segment tally-bar__segment--yes" style={{ width: `${yesPercent}%` }}>
          Yes {yes}
        </div>
        <div className="tally-bar__segment tally-bar__segment--no" style={{ width: `${noPercent}%` }}>
          No {no}
        </div>
      </div>
      <p className="muted small-text">Live votes updating in real time</p>
    </div>
  );
}

function ScaleTallies({ round }: { round: NonNullable<ReturnType<typeof useRoundState>['data']> }) {
  const votesByValue = new Map(round.tallies.map((entry) => [entry.value, entry.count]));
  const values = Array.from({ length: round.scale.max - round.scale.min + 1 }, (_, idx) => round.scale.min + idx);
  return (
    <div className="scale-tally-grid">
      {values.map((value) => (
        <div key={value} className="scale-tally-cell">
          <span className="scale-tally-value">{value}</span>
          <span className="scale-tally-count">{votesByValue.get(value) ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function UpcomingPreview({
  next,
  upcoming
}: {
  next: { name: string; series: string | null; imagePath: string; status: string };
  upcoming: Array<{ name: string; series: string | null; id: string }>;
}) {
  return (
    <div className="display-board">
      <div className="display-image">
        <img src={resolveImageUrl(next.imagePath)} alt="" />
      </div>
      <div className="display-metadata">
        <h3>{next.name}</h3>
        {next.series && <p className="muted">{next.series}</p>}
        <p className="muted small-text">Status: {next.status}</p>
        <div className="tally full-width">
          <span className="label">Upcoming</span>
          <span className="value upcoming-list">
            {upcoming.length > 0 ? upcoming.map((item) => item.name).join(' · ') : 'Waiting for the next challenger'}
          </span>
        </div>
      </div>
    </div>
  );
}
