import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getSocket } from './socket';
import type { RoundEndedPayload, RoundStartedPayload, RoundState, StateSnapshot, VoteProgressPayload } from '@waifu-panel/shared';

type Namespace = '/control' | '/display' | '/audience';

export function useRoundSocket(namespace: Namespace, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const socket = getSocket(namespace);

    const handleStart = (payload: RoundStartedPayload) => {
      queryClient.setQueryData<RoundState | null>(['round', 'current'], {
        id: payload.round.id,
        character: payload.round.character,
        mode: payload.round.mode,
        scale: { min: payload.round.scaleMin, max: payload.round.scaleMax },
        startedAt: payload.round.startedAt,
        tallies: [],
        status: 'live'
      });
    };

    const handleEnd = (payload: RoundEndedPayload) => {
      queryClient.setQueryData<RoundState | null>(['round', 'current'], (previous) => {
        if (!previous || previous.id !== payload.roundId) {
          return previous;
        }
        return {
          ...previous,
          tallies: payload.tallies,
          status: 'ended'
        };
      });
    };

    const handleVoteProgress = (payload: VoteProgressPayload) => {
      queryClient.setQueryData<RoundState | null>(['round', 'current'], (previous) => {
        if (!previous || previous.id !== payload.roundId) {
          return previous;
        }
        return {
          ...previous,
          tallies: payload.tallies
        };
      });
    };

    const handleStateInit = (payload: StateSnapshot) => {
      queryClient.setQueryData<RoundState | null>(['round', 'current'], payload.activeRound);
    };

    socket.on('round:started', handleStart);
    socket.on('round:ended', handleEnd);
    socket.on('vote:progress', handleVoteProgress);
    socket.on('state:init', handleStateInit);
    socket.emit('state:request');

    return () => {
      socket.off('round:started', handleStart);
      socket.off('round:ended', handleEnd);
      socket.off('vote:progress', handleVoteProgress);
      socket.off('state:init', handleStateInit);
    };
  }, [namespace, enabled, queryClient]);
}
