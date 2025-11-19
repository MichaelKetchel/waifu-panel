import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
import { submitVote } from '../api/votes';
import { resolveImageUrl } from '../utils/media';
import type { RoundState } from '../types/round';

export function AudienceVoting() {
  useRoundSocket('/audience');
  const roundQuery = useRoundState();
  const currentRound = roundQuery.data;
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSelectedValue(null);
    setFeedback(null);
  }, [currentRound?.id]);

  const voteMutation = useMutation({
    mutationFn: submitVote,
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Vote failed. Please try again.';
      setFeedback(message);
    },
    onSuccess: () => {
      setFeedback('Vote received! You can change it until the round ends.');
    }
  });

  const handleVote = (value: number) => {
    if (!currentRound) return;
    const normalized = currentRound.mode === 'yn' ? (value > 0 ? 1 : 0) : value;
    setSelectedValue(normalized);
    voteMutation.mutate({ roundId: currentRound.id, value });
  };

  return (
    <section>
      <h2>Audience Voting</h2>
      <p>Tap to vote as soon as a character goes live. Votes update in real time on the main display.</p>

      <div className="card audience-card">
        {currentRound ? (
          <LiveVoteCard
            round={currentRound}
            selectedValue={selectedValue}
            onVote={handleVote}
            isSubmitting={voteMutation.isPending}
            feedback={feedback}
          />
        ) : roundQuery.isLoading ? (
          <p className="muted">Checking for active rounds…</p>
        ) : (
          <p className="muted">No active round. Submissions are being queued—hang tight!</p>
        )}
      </div>
    </section>
  );
}

interface LiveVoteCardProps {
  round: RoundState;
  selectedValue: number | null;
  onVote: (value: number) => void;
  isSubmitting: boolean;
  feedback: string | null;
}

function LiveVoteCard({ round, selectedValue, onVote, isSubmitting, feedback }: LiveVoteCardProps) {
  if (!round) return null;

  const yesCount = round.tallies.find((tally) => tally.value === 1)?.count ?? 0;
  const noCount = round.tallies.find((tally) => tally.value === 0)?.count ?? 0;

  return (
    <div className="live-vote">
      <div className="live-vote__image">
        <img src={resolveImageUrl(round.character.imagePath)} alt="" />
      </div>
      <div className="live-vote__details">
        <h3>{round.character.name}</h3>
        {round.character.series && <p className="muted">{round.character.series}</p>}
        <p className="muted small-text">Mode: {round.mode === 'yn' ? 'Yes / No' : `${round.scale.min} – ${round.scale.max}`}</p>

        {round.mode === 'yn' ? (
          <div className="vote-controls">
            <button
              type="button"
              className={selectedValue === 1 ? 'active' : ''}
              onClick={() => onVote(1)}
              disabled={round.status !== 'live' || isSubmitting}
            >
              Yes ({yesCount})
            </button>
            <button
              type="button"
              className={selectedValue === 0 ? 'active' : ''}
              onClick={() => onVote(0)}
              disabled={round.status !== 'live' || isSubmitting}
            >
              No ({noCount})
            </button>
          </div>
        ) : (
          <ScaleVoteControls round={round} selectedValue={selectedValue} onVote={onVote} isSubmitting={isSubmitting} />
        )}

        {feedback && <p className="muted small-text">{feedback}</p>}
        {round.status === 'ended' && <p className="muted">Round closed. New character coming soon.</p>}
      </div>
    </div>
  );
}

function ScaleVoteControls({
  round,
  selectedValue,
  onVote,
  isSubmitting
}: {
  round: RoundState;
  selectedValue: number | null;
  onVote: (value: number) => void;
  isSubmitting: boolean;
}) {
  const votesByValue = new Map(round.tallies.map((entry) => [entry.value, entry.count]));
  const values = Array.from({ length: round.scale.max - round.scale.min + 1 }, (_, idx) => round.scale.min + idx);

  return (
    <div className="scale-vote">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          className={`scale-vote__option ${selectedValue === value ? 'active' : ''}`}
          onClick={() => onVote(value)}
          disabled={round.status !== 'live' || isSubmitting}
        >
          <span className="scale-vote__value">{value}</span>
          <span className="scale-vote__count">{votesByValue.get(value) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
