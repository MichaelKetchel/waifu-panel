import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from './socket';
export function useRoundSocket(namespace, enabled = true) {
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const socket = getSocket(namespace);
        const handleStart = (payload) => {
            queryClient.setQueryData(['round', 'current'], {
                id: payload.round.id,
                character: payload.round.character,
                mode: payload.round.mode,
                scale: { min: payload.round.scaleMin, max: payload.round.scaleMax },
                startedAt: payload.round.startedAt,
                tallies: [],
                status: 'live'
            });
        };
        const handleEnd = (payload) => {
            queryClient.setQueryData(['round', 'current'], (previous) => {
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
        const handleVoteProgress = (payload) => {
            queryClient.setQueryData(['round', 'current'], (previous) => {
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
