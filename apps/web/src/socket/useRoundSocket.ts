import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getSocket } from './socket';
import type { RoundState } from '../types/round';

interface RoundStartedPayload {
  round: {
    id: string;
    characterId: string;
    mode: string;
    scaleMin: number;
    scaleMax: number;
    startedAt: string;
    character: {
      name: string;
      imagePath: string;
      series?: string | null;
    };
  };
}

interface RoundEndedPayload {
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
}

interface VoteProgressPayload {
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
}

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

    socket.on('round:started', handleStart);
    socket.on('round:ended', handleEnd);
    socket.on('vote:progress', handleVoteProgress);

    return () => {
      socket.off('round:started', handleStart);
      socket.off('round:ended', handleEnd);
      socket.off('vote:progress', handleVoteProgress);
    };
  }, [namespace, enabled, queryClient]);
}
