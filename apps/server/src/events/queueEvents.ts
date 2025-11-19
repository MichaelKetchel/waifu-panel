import type { Socket } from 'socket.io';
import type { Namespace, Server as SocketIOServer } from 'socket.io';

interface QueueUpdatePayload {
  queue: Array<{
    id: string;
    position: number;
    status: string;
    name: string;
    series: string | null;
    imagePath: string;
  }>;
}

class QueueEvents {
  private controlNs?: Namespace;
  private displayNs?: Namespace;

  initialize(server: SocketIOServer) {
    this.controlNs = server.of('/control');
    this.displayNs = server.of('/display');
  }

  broadcastQueueUpdate(payload: QueueUpdatePayload) {
    if (!this.controlNs || !this.displayNs) return;
    this.controlNs.emit('queue:updated', payload);
    this.displayNs.emit('queue:updated', payload);
  }

  joinQueueRoom(socket: Socket) {
    socket.join('queue');
  }
}

export const queueEvents = new QueueEvents();
