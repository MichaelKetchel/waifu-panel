import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { fetchQueue, moveQueueItem, type QueueEntry } from '../api/queue';
import { moderateCharacter, type ModerationAction } from '../api/moderation';
import { disconnectSocket, getSocket } from '../socket/socket';
import { useQueueSocket } from '../socket/useQueueSocket';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
import { resolveImageUrl } from '../utils/media';
import { endRound, startRound, skipRound } from '../api/rounds';
import { fetchControlStatus, loginControl, logoutControl } from '../api/auth';
import { deleteSubmission } from '../api/submissions';

type ControlDialog =
  | { type: 'reject'; entry: QueueEntry; reason: string }
  | { type: 'skip-entry'; entry: QueueEntry }
  | { type: 'delete-entry'; entry: QueueEntry }
  | { type: 'skip-round'; roundId: string; characterName: string }
  | null;

export function ControlDeck() {
  const queryClient = useQueryClient();
  const [controlError, setControlError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ControlDialog>(null);
  const authQuery = useQuery({
    queryKey: ['control-auth'],
    queryFn: fetchControlStatus,
    staleTime: Infinity
  });
  const isAuthed = authQuery.data?.authenticated ?? false;

  useQueueSocket('/control', isAuthed);
  useRoundSocket('/control', isAuthed);
  const roundState = useRoundState({ enabled: isAuthed });

  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: fetchQueue,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity,
    enabled: isAuthed
  });

  const moderationMutation = useMutation({
    mutationFn: ({ characterId, action, reason }: { characterId: string; action: ModerationAction; reason?: string }) =>
      moderateCharacter(characterId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to update submission';
      setControlError(message);
    }
  });

  const moveQueueMutation = useMutation({
    mutationFn: ({ characterId, position }: { characterId: string; position: number }) => moveQueueItem(characterId, position),
    onSuccess: (data) => {
      queryClient.setQueryData(['queue'], data);
    },
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to move queue item';
      setControlError(message);
    }
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to delete submission';
      setControlError(message);
    }
  });

  const startRoundMutation = useMutation({
    mutationFn: startRound,
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to start round';
      setControlError(message);
    }
  });

  const endRoundMutation = useMutation({
    mutationFn: endRound,
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to end round';
      setControlError(message);
    }
  });

  const skipRoundMutation = useMutation({
    mutationFn: skipRound,
    onError: (error: any) => {
      const message = error?.body?.message ?? error?.message ?? 'Failed to skip round';
      setControlError(message);
    }
  });

  const queue = queueQuery.data?.queue ?? [];
  const queueError = queueQuery.error instanceof Error ? queueQuery.error : null;
  const nextUp = queue[0] ?? null;
  const currentRound = roundState.data;
  const nextUpIsApproved = nextUp?.status === 'approved';
  const queueActionPending = moderationMutation.isPending || moveQueueMutation.isPending || deleteSubmissionMutation.isPending;

  const queueMessage = useMemo(() => {
    if (queueQuery.isLoading && isAuthed) return 'Loading queue…';
    if (queueError) return queueError.message ?? 'Failed to load queue.';
    if (queue.length === 0) return 'Queue is empty. Approve a submission to get started.';
    return null;
  }, [queueQuery.isLoading, queueError, queue.length]);

  const handleModeration = (entry: QueueEntry, action: ModerationAction) => {
    if (moderationMutation.isPending) return;

    if (action === 'reject') {
      setDialog({ type: 'reject', entry, reason: '' });
      return;
    }

    if (action === 'skip') {
      setDialog({ type: 'skip-entry', entry });
      return;
    }

    setControlError(null);
    moderationMutation.mutate({ characterId: entry.id, action });
  };

  const handleStartRound = (mode: 'yn' | 'scale') => {
    if (!nextUp || !nextUpIsApproved || startRoundMutation.isPending || currentRound?.status === 'live') {
      return;
    }

    const scale = mode === 'scale' ? { min: 1, max: 5 } : undefined;
    setControlError(null);
    startRoundMutation.mutate({ characterId: nextUp.id, mode, scale });
  };

  const handleEndRound = () => {
    if (!currentRound || currentRound.status !== 'live' || endRoundMutation.isPending) {
      return;
    }

    setControlError(null);
    endRoundMutation.mutate({ roundId: currentRound.id });
  };

  const handleSkipRound = () => {
    if (!currentRound || currentRound.status !== 'live' || skipRoundMutation.isPending) {
      return;
    }

    setDialog({
      type: 'skip-round',
      roundId: currentRound.id,
      characterName: currentRound.character.name
    });
  };

  const handleMoveQueueItem = (entry: QueueEntry, position: number) => {
    if (moveQueueMutation.isPending) return;
    setControlError(null);
    moveQueueMutation.mutate({ characterId: entry.id, position });
  };

  const handleDeleteQueueItem = (entry: QueueEntry) => {
    if (deleteSubmissionMutation.isPending) return;
    setDialog({ type: 'delete-entry', entry });
  };

  const updateRejectReason = (reason: string) => {
    setDialog((current) => (current?.type === 'reject' ? { ...current, reason } : current));
  };

  const closeDialog = () => {
    if (moderationMutation.isPending || skipRoundMutation.isPending || deleteSubmissionMutation.isPending) return;
    setDialog(null);
  };

  const confirmDialog = () => {
    if (!dialog || moderationMutation.isPending || skipRoundMutation.isPending || deleteSubmissionMutation.isPending) return;

    setControlError(null);

    if (dialog.type === 'reject') {
      moderationMutation.mutate({
        characterId: dialog.entry.id,
        action: 'reject',
        reason: dialog.reason.trim() || undefined
      });
      setDialog(null);
      return;
    }

    if (dialog.type === 'skip-entry') {
      moderationMutation.mutate({ characterId: dialog.entry.id, action: 'skip' });
      setDialog(null);
      return;
    }

    if (dialog.type === 'delete-entry') {
      deleteSubmissionMutation.mutate(dialog.entry.id);
      setDialog(null);
      return;
    }

    skipRoundMutation.mutate({ roundId: dialog.roundId });
    setDialog(null);
  };

  const logoutMutation = useMutation({
    mutationFn: logoutControl,
    onSuccess: () => {
      disconnectSocket('/control');
      queryClient.invalidateQueries({ queryKey: ['control-auth'] });
      queryClient.removeQueries({ queryKey: ['queue'] });
      queryClient.setQueryData(['round', 'current'], null);
    }
  });

  if (!isAuthed) {
    return (
      <section>
        <h2>Control Deck</h2>
        <p>Enter the moderator passcode to unlock controls.</p>
        <ControlLoginCard isLoading={authQuery.isLoading} />
      </section>
    );
  }

  return (
    <section>
      <h2>Control Deck</h2>
      <p>
        Moderate submissions, prep the next roast, and keep the show moving. Queue updates stream in live; use refresh if
        the network hiccups.
      </p>

      <div className="control-actions">
        <button type="button" className="ghost" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
        </button>
      </div>

      {controlError && <p className="error control-error">{controlError}</p>}

      <div className="control-grid">
        <div className="card">
          <header className="card-header">
            <h3>Current Round</h3>
            <span className={`status-tag ${currentRound ? 'status-tag--live' : 'status-tag--disabled'}`}>
              {currentRound ? currentRound.status : 'idle'}
            </span>
          </header>
          {currentRound ? (
            <div className="current-round">
              <div className="current-round__image">
                <img src={resolveImageUrl(currentRound.character.imagePath)} alt="" />
              </div>
              <div className="current-round__details">
                <h4>{currentRound.character.name}</h4>
                {currentRound.character.series && <p className="muted">{currentRound.character.series}</p>}
                <p className="muted small-text">
                  Mode: {currentRound.mode === 'yn' ? 'Yes / No' : `${currentRound.scale.min} – ${currentRound.scale.max}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="muted">No character live. Start a round when you are ready to roast.</p>
          )}
          <div className="actions">
            <button
              disabled={!currentRound || currentRound.status !== 'live' || endRoundMutation.isPending}
              onClick={handleEndRound}
            >
              {endRoundMutation.isPending ? 'Ending…' : 'End Round'}
            </button>
            <button
              className="secondary"
              disabled={!currentRound || currentRound.status !== 'live' || skipRoundMutation.isPending}
              onClick={handleSkipRound}
            >
              {skipRoundMutation.isPending ? 'Skipping…' : 'Skip Character'}
            </button>
          </div>
        </div>

        <div className="card">
          <header className="card-header">
            <h3>Next Up</h3>
            {queueQuery.isFetching && <span className="status-tag">syncing</span>}
          </header>

          {nextUp ? (
            <NextUpCard entry={nextUp} onModerate={handleModeration} isMutating={queueActionPending} />
          ) : (
            <p className="muted">{queueMessage}</p>
          )}

          {nextUp && !nextUpIsApproved && (
            <p className="muted small-text">Approve the next queue item before starting a round.</p>
          )}

          <div className="actions">
            <button
              disabled={!nextUp || !nextUpIsApproved || currentRound?.status === 'live' || startRoundMutation.isPending}
              onClick={() => handleStartRound('yn')}
            >
              {startRoundMutation.isPending ? 'Starting…' : 'Start Round (Yes/No)'}
            </button>
            <button
              disabled={!nextUp || !nextUpIsApproved || currentRound?.status === 'live' || startRoundMutation.isPending}
              onClick={() => handleStartRound('scale')}
            >
              {startRoundMutation.isPending ? 'Starting…' : 'Start Round (1–5)'}
            </button>
          </div>
        </div>

        <div className="card wide">
          <header className="card-header">
            <h3>Submission Queue</h3>
            <div className="queue-controls">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  getSocket('/control').emit('queue:fetch');
                  queueQuery.refetch().catch(() => {
                    // ignore errors, socket will push updates
                  });
                }}
                disabled={queueQuery.isFetching}
              >
                Refresh
              </button>
              <span className="muted small-text">
                {queueQuery.isFetching ? 'Refreshing…' : `${queue.length} item${queue.length === 1 ? '' : 's'}`}
              </span>
            </div>
          </header>

          {queueMessage && queue.length === 0 ? (
            <p className="muted">{queueMessage}</p>
          ) : (
            <ul className="queue-list">
              {queue.map((entry, index) => (
                <QueueListItem
                  key={entry.id}
                  entry={entry}
                  place={index + 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < queue.length - 1}
                  isMutating={queueActionPending}
                  onModerate={handleModeration}
                  onDelete={handleDeleteQueueItem}
                  onMove={handleMoveQueueItem}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ControlActionDialog
        dialog={dialog}
        isPending={moderationMutation.isPending || skipRoundMutation.isPending || deleteSubmissionMutation.isPending}
        onCancel={closeDialog}
        onConfirm={confirmDialog}
        onReasonChange={updateRejectReason}
      />
    </section>
  );
}

function ControlActionDialog({
  dialog,
  isPending,
  onCancel,
  onConfirm,
  onReasonChange
}: {
  dialog: ControlDialog;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
}) {
  if (!dialog) return null;

  const title =
    dialog.type === 'reject'
      ? `Reject ${dialog.entry.name}`
      : dialog.type === 'skip-entry'
        ? `Skip ${dialog.entry.name}`
        : dialog.type === 'delete-entry'
          ? `Delete ${dialog.entry.name}`
        : `Skip ${dialog.characterName}`;

  const confirmLabel =
    dialog.type === 'reject'
      ? 'Reject'
      : dialog.type === 'skip-entry'
        ? 'Skip Submission'
        : dialog.type === 'delete-entry'
          ? 'Delete'
          : 'Skip Round';

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="control-dialog-title">
        <h3 id="control-dialog-title">{title}</h3>
        {dialog.type === 'reject' ? (
          <label className="field">
            <span>Reason (optional)</span>
            <textarea
              value={dialog.reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Add moderator context for this rejection."
              disabled={isPending}
            />
          </label>
        ) : dialog.type === 'skip-entry' ? (
          <p className="muted">This removes the submission from the active queue without changing the current round.</p>
        ) : dialog.type === 'delete-entry' ? (
          <p className="muted">This permanently removes the submission and any finished round data tied to it.</p>
        ) : (
          <p className="muted">This closes the current round and discards its audience votes.</p>
        )}
        <div className="actions modal-actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="secondary" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlLoginCard({ isLoading }: { isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (code: string) => loginControl(code),
    onSuccess: () => {
      setPasscode('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['control-auth'] });
    },
    onError: () => {
      setError('Incorrect passcode. Try again.');
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passcode.trim()) return;
    loginMutation.mutate(passcode.trim());
  };

  return (
    <div className="card login-card">
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Passcode</span>
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            disabled={isLoading || loginMutation.isPending}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isLoading || loginMutation.isPending}>
          {loginMutation.isPending ? 'Verifying…' : 'Unlock Control Deck'}
        </button>
      </form>
    </div>
  );
}

function NextUpCard({
  entry,
  onModerate,
  isMutating
}: {
  entry: QueueEntry;
  onModerate: (entry: QueueEntry, action: ModerationAction) => void;
  isMutating: boolean;
}) {
  return (
    <div className="next-up">
      <div className="next-up__image">
        <img src={resolveImageUrl(entry.imagePath)} alt="" />
      </div>
      <div className="next-up__details">
        <h4>{entry.name}</h4>
        {entry.series && <p className="muted">{entry.series}</p>}
        <div className="actions">
          <button type="button" disabled={isMutating} onClick={() => onModerate(entry, 'approve')}>
            Approve
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isMutating}
            onClick={() => onModerate(entry, 'reject')}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function QueueListItem({
  entry,
  onModerate,
  onDelete,
  onMove,
  place,
  canMoveUp,
  canMoveDown,
  isMutating
}: {
  entry: QueueEntry;
  onModerate: (entry: QueueEntry, action: ModerationAction) => void;
  onDelete: (entry: QueueEntry) => void;
  onMove: (entry: QueueEntry, position: number) => void;
  place: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isMutating: boolean;
}) {
  return (
    <li className="queue-item">
      <div className="queue-item__index">{place}</div>
      <div className="queue-item__image">
        <img src={resolveImageUrl(entry.imagePath)} alt="" />
      </div>
      <div className="queue-item__details">
        <div className="queue-item__title">
          <span className="queue-item__name">{entry.name}</span>
          {entry.series && <span className="queue-item__series">{entry.series}</span>}
        </div>
        <div className="queue-item__status">
          <span className={`status-tag status-tag--${entry.status}`}>{entry.status}</span>
        </div>
      </div>
      <div className="queue-item__actions">
        <button type="button" className="ghost" disabled={isMutating || !canMoveUp} onClick={() => onMove(entry, place - 1)}>
          Up
        </button>
        <button
          type="button"
          className="ghost"
          disabled={isMutating || !canMoveDown}
          onClick={() => onMove(entry, place + 1)}
        >
          Down
        </button>
        <button type="button" disabled={isMutating} onClick={() => onModerate(entry, 'approve')}>
          Approve
        </button>
        <button type="button" className="secondary" disabled={isMutating} onClick={() => onModerate(entry, 'reject')}>
          Reject
        </button>
        <button type="button" className="ghost" disabled={isMutating} onClick={() => onModerate(entry, 'skip')}>
          Skip
        </button>
        <button type="button" className="ghost" disabled={isMutating} onClick={() => onDelete(entry)}>
          Delete
        </button>
      </div>
    </li>
  );
}
