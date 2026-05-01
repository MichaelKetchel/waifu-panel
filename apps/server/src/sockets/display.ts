import type { Server as SocketIOServer } from 'socket.io';

import { queueService } from '../services/queueService.js';
import { getStateSnapshot } from '../services/stateService.js';

export function registerDisplayNamespace(io: SocketIOServer) {
  const namespace = io.of('/display');

  namespace.on('connection', async (socket) => {
    const queue = await queueService.snapshot({ approvedOnly: true });
    socket.emit('state:init', await getStateSnapshot({ approvedQueueOnly: true }));
    socket.emit('queue:updated', { queue });

    socket.on('state:request', async () => {
      socket.emit('state:init', await getStateSnapshot({ approvedQueueOnly: true }));
    });
  });
}
