import { io, type Socket } from 'socket.io-client';

import { getSocketBaseUrl } from '../config/publicConfig';

const SOCKETS = new Map<string, Socket>();

export function getSocket(namespace: string): Socket {
  if (!SOCKETS.has(namespace)) {
    const socket = io(`${getSocketBaseUrl()}${namespace}`, {
      withCredentials: true,
      transports: ['websocket']
    });
    SOCKETS.set(namespace, socket);
  }

  const existing = SOCKETS.get(namespace);
  if (!existing) {
    throw new Error('Socket failed to initialize');
  }
  return existing;
}

export function disconnectSocket(namespace: string) {
  const socket = SOCKETS.get(namespace);
  if (!socket) return;

  socket.disconnect();
  SOCKETS.delete(namespace);
}
