import type { Server as SocketIOServer } from 'socket.io';

export function registerSubmissionNamespace(io: SocketIOServer) {
  const namespace = io.of('/submission');

  namespace.on('connection', (socket) => {
    socket.emit('submission:welcome', { message: 'Submission channel ready' });
  });
}
