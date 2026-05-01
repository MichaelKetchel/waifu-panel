import type { Server as SocketIOServer } from 'socket.io';
import { getStateSnapshot } from '../services/stateService.js';

export function registerSubmissionNamespace(io: SocketIOServer) {
  const namespace = io.of('/submission');

  namespace.on('connection', (socket) => {
    socket.emit('submission:welcome', { message: 'Submission channel ready' });

    socket.on('state:request', async () => {
      socket.emit('state:init', await getStateSnapshot());
    });
  });
}
