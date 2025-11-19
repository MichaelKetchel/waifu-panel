import type { Server as SocketIOServer } from 'socket.io';

import { queueService } from '../services/queueService.js';

export function registerDisplayNamespace(io: SocketIOServer) {
  const namespace = io.of('/display');

  namespace.on('connection', async (socket) => {
    const queue = await queueService.snapshot();
    socket.emit('queue:updated', { queue });
  });
}
