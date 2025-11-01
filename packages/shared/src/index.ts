export type VoteMode = 'yn' | 'scale';

export interface CharacterSummary {
  id: string;
  name: string;
  series?: string;
  imageUrl: string;
  submitterAlias?: string;
}

export interface QueueEntry {
  character: CharacterSummary;
  position: number;
  status: 'queued' | 'approved' | 'live';
}

export interface RoundDetail {
  id: string;
  character: CharacterSummary;
  mode: VoteMode;
  scale?: {
    min: number;
    max: number;
  };
  startedAt: string;
}

export interface VoteTallies {
  roundId: string;
  totals: Record<string, number>;
}

export interface StateSnapshot {
  queue: QueueEntry[];
  activeRound?: RoundDetail & {
    tallies: VoteTallies['totals'];
  };
  upcoming: CharacterSummary[];
  settings: SettingsPayload;
}

export interface SettingsPayload {
  submissionLimit: number;
  voteModeDefault: VoteMode;
  requirePasscode: boolean;
}
