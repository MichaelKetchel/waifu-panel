import type { Namespace, Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

interface RoundStartPayload {
  round: {
    id: string;
    characterId: string;
    mode: string;
    scaleMin: number;
    scaleMax: number;
    startedAt: string;
    character: {
      id: string;
      name: string;
      imagePath: string;
      series?: string | null;
    };
  };
}

interface RoundEndPayload {
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
}

interface VoteProgressPayload {
  roundId: string;
  tallies: Array<{ value: number; count: number }>;
}

interface CharacterSkippedPayload {
  characterId: string;
  roundId?: string;
  reason?: string;
}

class RoundEvents {
  private controlNs?: Namespace;
  private displayNs?: Namespace;
  private audienceNs?: Namespace;

  initialize(server: SocketIOServer) {
    this.controlNs = server.of('/control');
    this.displayNs = server.of('/display');
    this.audienceNs = server.of('/audience');
  }

  registerAudienceSocket(socket: Socket) {
    socket.join('audience');
  }

  broadcastRoundStart(payload: RoundStartPayload) {
    this.controlNs?.emit('round:started', payload);
    this.displayNs?.emit('round:started', payload);
    this.audienceNs?.emit('round:started', payload);
  }

  broadcastRoundEnd(payload: RoundEndPayload) {
    this.controlNs?.emit('round:ended', payload);
    this.displayNs?.emit('round:ended', payload);
    this.audienceNs?.emit('round:ended', payload);
  }

  broadcastVoteProgress(payload: VoteProgressPayload) {
    this.controlNs?.emit('vote:progress', payload);
    this.displayNs?.emit('vote:progress', payload);
    this.audienceNs?.emit('vote:progress', payload);
  }

  broadcastCharacterSkipped(payload: CharacterSkippedPayload) {
    this.controlNs?.emit('character:skipped', payload);
    this.displayNs?.emit('character:skipped', payload);
    this.audienceNs?.emit('character:skipped', payload);
  }
}

export const roundsEvents = new RoundEvents();
