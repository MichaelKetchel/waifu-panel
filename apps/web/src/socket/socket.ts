import { io, type Socket } from 'socket.io-client';

const SOCKETS = new Map<string, Socket>();

function getBaseUrl() {
  const base = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export function getSocket(namespace: string): Socket {
  if (!SOCKETS.has(namespace)) {
    const socket = io(`${getBaseUrl()}${namespace}`, {
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
