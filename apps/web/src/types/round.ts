export interface RoundState {
  id: string;
  character: {
    name: string;
    imagePath: string;
    series?: string | null;
  };
  mode: string;
  scale: { min: number; max: number };
  startedAt: string;
  tallies: Array<{ value: number; count: number }>;
  status: 'live' | 'ended';
}
