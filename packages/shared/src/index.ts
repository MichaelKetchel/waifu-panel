export type VoteMode = 'yn' | 'scale';
export type CharacterStatus = 'queued' | 'approved' | 'rejected' | 'live' | 'archived';

export interface CharacterSummary {
  id: string;
  name: string;
  series: string | null;
  description?: string | null;
  imagePath: string;
  submitterAlias?: string | null;
  status?: CharacterStatus;
}

export interface QueueEntry {
  id: string;
  position: number;
  status: CharacterStatus;
  name: string;
  series: string | null;
  description?: string | null;
  submitterAlias?: string | null;
  imagePath: string;
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

export interface VoteTally {
  value: number;
  count: number;
}

export interface VoteTallies {
  roundId: string;
  tallies: VoteTally[];
}

export interface RoundState {
  id: string;
  character: CharacterSummary;
  mode: VoteMode;
  scale: {
    min: number;
    max: number;
  };
  startedAt: string;
  tallies: VoteTally[];
  status: 'live' | 'ended';
}

export interface StateSnapshot {
  schemaVersion: number;
  queue: QueueEntry[];
  activeRound: RoundState | null;
  upcoming: CharacterSummary[];
  settings: SettingsPayload;
}

export interface SettingsPayload {
  submissionLimit: number;
  voteModeDefault: VoteMode;
  requirePasscode: boolean;
}

export interface PublicConfig {
  frontendBaseUrl: string;
  backendBaseUrl: string;
  submissionImageMaxBytes: number;
}

export interface RoundStartedPayload {
  round: {
    id: string;
    characterId: string;
    mode: VoteMode;
    scaleMin: number;
    scaleMax: number;
    startedAt: string;
    character: CharacterSummary;
  };
}

export interface RoundEndedPayload {
  roundId: string;
  tallies: VoteTally[];
}

export interface VoteProgressPayload {
  roundId: string;
  tallies: VoteTally[];
}
