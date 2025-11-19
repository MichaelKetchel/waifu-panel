import type { Server as SocketIOServer } from 'socket.io';

import { roundsEvents } from '../events/roundEvents.js';

export function registerAudienceNamespace(io: SocketIOServer) {
  const namespace = io.of('/audience');

  namespace.on('connection', (socket) => {
    roundsEvents.registerAudienceSocket(socket);
  });
}
