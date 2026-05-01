import type { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

import { queueEvents } from '../events/queueEvents.js';
import { queueService } from '../services/queueService.js';
import { getStateSnapshot } from '../services/stateService.js';
import { CONTROL_COOKIE, hasValidControlToken } from '../middleware/controlAuth.js';

const queueMoveSchema = z.object({
  characterId: z.string().uuid(),
  position: z.number().int().min(1)
});

export function registerControlNamespace(io: SocketIOServer) {
  const namespace = io.of('/control');

  namespace.use((socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, CONTROL_COOKIE);
    if (!hasValidControlToken(token)) {
      return next(new Error('Control authentication required'));
    }

    return next();
  });

  namespace.on('connection', async (socket) => {
    queueEvents.joinQueueRoom(socket);
    const queue = await queueService.snapshot();
    socket.emit('state:init', await getStateSnapshot());
    socket.emit('queue:updated', { queue });

    socket.on('queue:fetch', async () => {
      const queue = await queueService.snapshot();
      socket.emit('queue:updated', { queue });
    });

    socket.on('state:request', async () => {
      socket.emit('state:init', await getStateSnapshot());
    });

    socket.on('control:queue:move', async (payload, ack?: (response: { ok: boolean; message?: string }) => void) => {
      const parseResult = queueMoveSchema.safeParse(payload);
      if (!parseResult.success) {
        ack?.({ ok: false, message: 'Invalid queue move payload' });
        return;
      }

      try {
        await queueService.updatePosition(parseResult.data.characterId, parseResult.data.position);
        ack?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to move queue item';
        socket.emit('error', { code: 'QUEUE_MOVE_FAILED', message });
        ack?.({ ok: false, message });
      }
    });
  });
}

function readCookie(header: string | string[] | undefined, name: string) {
  const cookieHeader = Array.isArray(header) ? header.join(';') : header;
  if (!cookieHeader) return undefined;

  const prefix = `${name}=`;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}
