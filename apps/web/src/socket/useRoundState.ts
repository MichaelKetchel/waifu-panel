import { useQuery } from '@tanstack/react-query';

import type { RoundState } from '../types/round';
import { fetchCurrentRound } from '../api/rounds';

interface Options {
  enabled?: boolean;
}

export function useRoundState(options?: Options) {
  return useQuery<RoundState | null>({
    queryKey: ['round', 'current'],
    queryFn: fetchCurrentRound,
    initialData: null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: options?.enabled ?? true
  });
}
