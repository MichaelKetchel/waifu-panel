import type { Server as SocketIOServer } from 'socket.io';

import { queueEvents } from '../events/queueEvents.js';
import { queueService } from '../services/queueService.js';

export function registerControlNamespace(io: SocketIOServer) {
  const namespace = io.of('/control');

  namespace.on('connection', async (socket) => {
    queueEvents.joinQueueRoom(socket);
    const queue = await queueService.snapshot();
    socket.emit('queue:updated', { queue });

    socket.on('queue:fetch', async () => {
      const queue = await queueService.snapshot();
      socket.emit('queue:updated', { queue });
    });
  });
}
