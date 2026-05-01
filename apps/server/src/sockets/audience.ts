import type { Server as SocketIOServer } from 'socket.io';

import { roundsEvents } from '../events/roundEvents.js';
import { getStateSnapshot } from '../services/stateService.js';

export function registerAudienceNamespace(io: SocketIOServer) {
  const namespace = io.of('/audience');

  namespace.on('connection', async (socket) => {
    roundsEvents.registerAudienceSocket(socket);
    socket.emit('state:init', await getStateSnapshot());

    socket.on('state:request', async () => {
      socket.emit('state:init', await getStateSnapshot());
    });
  });
}
