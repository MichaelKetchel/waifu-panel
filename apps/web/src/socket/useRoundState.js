import { useQuery } from '@tanstack/react-query';
import { fetchCurrentRound } from '../api/rounds';
export function useRoundState(options) {
    return useQuery({
        queryKey: ['round', 'current'],
        queryFn: fetchCurrentRound,
        initialData: null,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        enabled: options?.enabled ?? true
    });
}
